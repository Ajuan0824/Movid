#!/usr/bin/env python3
"""
extract_highlights.py

Analiza un video corto (~15s) con la API de Gemini para identificar los 5 mejores
momentos/imagenes, y extrae esos fotogramas como archivos JPG usando ffmpeg.

Uso:
    python extract_highlights.py <ruta_al_video.mp4> [--output-dir ./output]
                                  [--model gemini-2.5-flash-lite]
                                  [--fallback-model gemini-2.5-flash]

Requisitos:
    - Variable de entorno GEMINI_API_KEY seteada con una API key valida de Gemini.
    - ffmpeg (y ffprobe, que viene con ffmpeg) instalado y disponible en el PATH.
    - Dependencias de Python: ver requirements.txt (google-genai).

NOTA IMPORTANTE PARA EL USUARIO (verificar contra la documentacion oficial):
    Este script usa el SDK oficial `google-genai` (paquete pip `google-genai`,
    import `from google import genai`). La forma de subir archivos y generar
    contenido fue verificada contra la documentacion oficial del SDK
    (googleapis/python-genai) al momento de escribir este script:
        file = client.files.upload(file=<ruta>)
        response = client.models.generate_content(model=<modelo>, contents=[prompt, file])
    Los videos subidos requieren un tiempo de procesamiento en el backend de
    Gemini antes de poder usarse (el archivo pasa por un estado "PROCESSING"
    hasta llegar a "ACTIVE" o "FAILED"). Este script hace polling de
    `client.files.get(name=file.name)` chequeando `file.state.name` hasta que
    deje de ser "PROCESSING". Si el SDK cambio esta API (nombres de metodos,
    forma del objeto `state`, etc.) desde que se escribio este script, ajustar
    la funcion `_esperar_archivo_activo`.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuracion / constantes
# ---------------------------------------------------------------------------

MODELO_DEFAULT = "gemini-2.5-flash-lite"
MODELO_FALLBACK_DEFAULT = "gemini-2.5-flash"
CANTIDAD_MOMENTOS = 5
OUTPUT_DIR_DEFAULT = "./output"

# Tiempo maximo (segundos) esperando que Gemini termine de procesar el archivo
# de video subido antes de darnos por vencidos.
TIMEOUT_PROCESAMIENTO_ARCHIVO_SEG = 180
INTERVALO_POLLING_SEG = 2

PROMPT_TEMPLATE = """Analiza este video completo con atencion.

Tu tarea es identificar los {cantidad} mejores momentos/imagenes del video
(los fotogramas mas destacados, visualmente interesantes o significativos).

Para cada uno de los {cantidad} momentos debes indicar:
- "timestamp": el instante exacto dentro del video, en formato "mm:ss.ms"
  (por ejemplo "00:03.500" para el segundo 3 con 500 milisegundos).
- "reason": una razon breve de por que es un buen momento (composicion,
  expresion, accion, iluminacion, etc.).

Respondé UNICAMENTE con un JSON valido, sin texto adicional antes o despues,
con exactamente esta estructura (una lista de {cantidad} objetos):

[
  {{"timestamp": "00:03.500", "reason": "..."}},
  {{"timestamp": "00:07.120", "reason": "..."}}
]
"""

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
logger = logging.getLogger("extract_highlights")


@dataclass
class Momento:
    timestamp: str
    reason: str
    segundos: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def timestamp_a_segundos(timestamp: str) -> float:
    """Convierte un timestamp 'mm:ss.ms' (o 'hh:mm:ss.ms') a segundos (float).

    Acepta variantes razonables que Gemini podria devolver:
        "mm:ss.ms", "mm:ss", "hh:mm:ss.ms", "ss.ms", "ss"
    """
    timestamp = timestamp.strip()
    partes = timestamp.split(":")

    try:
        if len(partes) == 3:
            horas, minutos, segundos = partes
            total = int(horas) * 3600 + int(minutos) * 60 + float(segundos)
        elif len(partes) == 2:
            minutos, segundos = partes
            total = int(minutos) * 60 + float(segundos)
        elif len(partes) == 1:
            total = float(partes[0])
        else:
            raise ValueError(f"Formato de timestamp no reconocido: '{timestamp}'")
    except ValueError as exc:
        raise ValueError(
            f"No se pudo parsear el timestamp '{timestamp}': {exc}"
        ) from exc

    return total


def parsear_respuesta_json(texto_respuesta: str) -> list[dict]:
    """Limpia y parsea la respuesta de Gemini a una lista de dicts.

    Gemini a veces envuelve el JSON en bloques de codigo markdown
    (```json ... ``` o ``` ... ```). Esta funcion los remueve antes de parsear.
    """
    texto = texto_respuesta.strip()

    # Remover fences tipo ```json ... ``` o ``` ... ```
    fence_match = re.match(
        r"^```(?:json)?\s*(.*?)\s*```$", texto, flags=re.DOTALL | re.IGNORECASE
    )
    if fence_match:
        texto = fence_match.group(1).strip()
    else:
        # A veces solo hay un fence de apertura o el texto tiene ruido alrededor
        # del JSON. Como fallback, intentamos extraer el primer bloque que
        # parezca un array JSON (desde el primer '[' hasta el ultimo ']').
        inicio = texto.find("[")
        fin = texto.rfind("]")
        if inicio != -1 and fin != -1 and fin > inicio:
            texto = texto[inicio : fin + 1]

    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"La respuesta de Gemini no es JSON valido tras la limpieza: {exc}\n"
            f"Contenido recibido (post-limpieza): {texto[:500]}"
        ) from exc

    if not isinstance(datos, list):
        raise ValueError(
            f"Se esperaba una lista JSON de momentos, se recibio: {type(datos)}"
        )

    for item in datos:
        if not isinstance(item, dict) or "timestamp" not in item or "reason" not in item:
            raise ValueError(
                f"Cada elemento debe ser un objeto con 'timestamp' y 'reason'. "
                f"Elemento invalido: {item!r}"
            )

    return datos


def obtener_duracion_video(video_path: Path) -> float:
    """Obtiene la duracion (en segundos) de un video usando ffprobe."""
    if shutil.which("ffprobe") is None:
        # Fallback: usar `ffmpeg -i` y parsear stderr si ffprobe no esta disponible.
        return _obtener_duracion_con_ffmpeg(video_path)

    comando = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(video_path),
    ]
    try:
        resultado = subprocess.run(
            comando, capture_output=True, text=True, check=True
        )
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"ffprobe fallo al obtener la duracion del video: {exc.stderr}"
        ) from exc

    salida = resultado.stdout.strip()
    try:
        return float(salida)
    except ValueError as exc:
        raise RuntimeError(
            f"No se pudo interpretar la duracion devuelta por ffprobe: '{salida}'"
        ) from exc


def _obtener_duracion_con_ffmpeg(video_path: Path) -> float:
    """Fallback para obtener la duracion via 'ffmpeg -i' parseando stderr."""
    comando = ["ffmpeg", "-i", str(video_path)]
    resultado = subprocess.run(comando, capture_output=True, text=True)
    match = re.search(
        r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", resultado.stderr
    )
    if not match:
        raise RuntimeError(
            "No se pudo determinar la duracion del video (ni ffprobe ni "
            "'ffmpeg -i' devolvieron un resultado interpretable)."
        )
    horas, minutos, segundos = match.groups()
    return int(horas) * 3600 + int(minutos) * 60 + float(segundos)


# ---------------------------------------------------------------------------
# Paso 1: analizar el video con Gemini
# ---------------------------------------------------------------------------


def _esperar_archivo_activo(client, archivo, timeout_seg: int = TIMEOUT_PROCESAMIENTO_ARCHIVO_SEG):
    """Espera (polling) a que un archivo subido a Gemini termine de procesarse.

    Los videos subidos con client.files.upload quedan en estado "PROCESSING"
    hasta que el backend termina de indexarlos; recien ahi pasan a "ACTIVE"
    (o "FAILED" si algo salio mal). Ver nota al inicio del archivo sobre
    posibles cambios en esta API del SDK.
    """
    inicio = time.monotonic()
    estado_actual = getattr(archivo.state, "name", str(archivo.state))
    logger.info("Estado inicial del archivo subido: %s", estado_actual)

    while estado_actual == "PROCESSING":
        if time.monotonic() - inicio > timeout_seg:
            raise TimeoutError(
                f"El archivo sigue en estado PROCESSING tras {timeout_seg}s. "
                "Aborto para no quedar esperando indefinidamente."
            )
        time.sleep(INTERVALO_POLLING_SEG)
        archivo = client.files.get(name=archivo.name)
        estado_actual = getattr(archivo.state, "name", str(archivo.state))
        logger.info("Esperando procesamiento del archivo... estado=%s", estado_actual)

    if estado_actual != "ACTIVE":
        raise RuntimeError(
            f"El archivo subido termino en estado '{estado_actual}' (se esperaba 'ACTIVE')."
        )

    return archivo


def _llamar_gemini(client, model: str, video_path: Path, prompt: str) -> str:
    """Sube el video y genera contenido con el modelo indicado. Devuelve el texto crudo."""
    logger.info("Subiendo video a Gemini Files API: %s", video_path)
    archivo = client.files.upload(file=str(video_path))
    archivo = _esperar_archivo_activo(client, archivo)

    logger.info("Solicitando analisis del video al modelo '%s'...", model)
    respuesta = client.models.generate_content(
        model=model,
        contents=[prompt, archivo],
    )

    texto = getattr(respuesta, "text", None)
    if not texto:
        raise RuntimeError(
            f"La respuesta del modelo '{model}' no contiene texto utilizable."
        )
    return texto


def analizar_video(
    video_path: Path,
    model: str = MODELO_DEFAULT,
    fallback_model: str = MODELO_FALLBACK_DEFAULT,
) -> list[dict]:
    """Analiza el video con Gemini y devuelve los momentos destacados.

    Intenta primero con `model`. Si la llamada a la API falla (excepcion),
    reintenta automaticamente con `fallback_model` antes de fallar del todo.

    Devuelve una lista de dicts con las claves "timestamp" y "reason", tal
    como los devolvio Gemini (ya parseados desde JSON).
    """
    try:
        from google import genai
    except ImportError as exc:
        logger.error(
            "No se encontro el paquete 'google-genai'. Instalalo con: "
            "pip install -r requirements.txt"
        )
        raise SystemExit(1) from exc

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error(
            "Falta la variable de entorno GEMINI_API_KEY. "
            "Seteala antes de ejecutar el script (ej: export GEMINI_API_KEY=...)."
        )
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    prompt = PROMPT_TEMPLATE.format(cantidad=CANTIDAD_MOMENTOS)

    texto_respuesta: str | None = None
    ultimo_error: Exception | None = None

    for intento_model in (model, fallback_model):
        try:
            texto_respuesta = _llamar_gemini(client, intento_model, video_path, prompt)
            logger.info("Respuesta obtenida exitosamente con el modelo '%s'.", intento_model)
            break
        except Exception as exc:  # noqa: BLE001 - queremos capturar cualquier error de API
            ultimo_error = exc
            logger.warning(
                "Fallo la llamada a Gemini con el modelo '%s': %s", intento_model, exc
            )
            if intento_model == model and fallback_model and fallback_model != model:
                logger.info("Reintentando con el modelo de fallback '%s'...", fallback_model)
            continue

    if texto_respuesta is None:
        logger.error(
            "Fallaron tanto el modelo principal ('%s') como el fallback ('%s'). "
            "Ultimo error: %s",
            model,
            fallback_model,
            ultimo_error,
        )
        sys.exit(1)

    try:
        momentos_raw = parsear_respuesta_json(texto_respuesta)
    except ValueError as exc:
        logger.error("No se pudo interpretar la respuesta de Gemini como JSON: %s", exc)
        sys.exit(1)

    if len(momentos_raw) == 0:
        logger.error("Gemini devolvio una lista vacia de momentos.")
        sys.exit(1)

    return momentos_raw


# ---------------------------------------------------------------------------
# Paso 2: extraer frames con ffmpeg
# ---------------------------------------------------------------------------


def extraer_frames(
    video_path: Path,
    momentos: list[dict],
    output_dir: Path,
) -> list[dict]:
    """Extrae un frame JPG por cada momento usando ffmpeg.

    `momentos` es la lista cruda devuelta por Gemini (dicts con "timestamp" y
    "reason"). Valida cada timestamp contra la duracion real del video antes
    de invocar a ffmpeg. Devuelve una lista de dicts con:
        {"path": <ruta absoluta al jpg>, "timestamp": ..., "reason": ...}
    para los frames extraidos exitosamente.
    """
    if shutil.which("ffmpeg") is None:
        logger.error(
            "ffmpeg no esta instalado o no se encuentra en el PATH. "
            "Instalalo desde https://ffmpeg.org/download.html"
        )
        sys.exit(1)

    duracion_video = obtener_duracion_video(video_path)
    logger.info("Duracion del video detectada: %.3f segundos", duracion_video)

    output_dir.mkdir(parents=True, exist_ok=True)

    resultados: list[dict] = []

    for idx, momento in enumerate(momentos, start=1):
        timestamp_str = str(momento["timestamp"])
        reason = str(momento["reason"])

        try:
            segundos = timestamp_a_segundos(timestamp_str)
        except ValueError as exc:
            logger.error(
                "Timestamp invalido para el momento #%d ('%s'): %s. Se omite este frame.",
                idx,
                timestamp_str,
                exc,
            )
            continue

        if segundos < 0 or segundos > duracion_video:
            logger.error(
                "Timestamp fuera de rango para el momento #%d: %s (%.3fs) "
                "excede la duracion del video (%.3fs). Se omite este frame.",
                idx,
                timestamp_str,
                segundos,
                duracion_video,
            )
            continue

        nombre_archivo = f"frame_{idx}.jpg"
        ruta_salida = output_dir / nombre_archivo

        comando = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{segundos:.3f}",
            "-i",
            str(video_path),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(ruta_salida),
        ]

        logger.info(
            "Extrayendo frame #%d en timestamp %s (%.3fs) -> %s",
            idx,
            timestamp_str,
            segundos,
            ruta_salida,
        )

        try:
            subprocess.run(comando, capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as exc:
            logger.error(
                "ffmpeg fallo al extraer el frame #%d (timestamp %s): %s",
                idx,
                timestamp_str,
                exc.stderr,
            )
            continue

        resultados.append(
            {
                "path": str(ruta_salida.resolve()),
                "timestamp": timestamp_str,
                "reason": reason,
            }
        )

    if not resultados:
        logger.error(
            "No se pudo extraer ningun frame valido (todos los timestamps "
            "fueron invalidos o estuvieron fuera de rango)."
        )
        sys.exit(1)

    return resultados


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Analiza un video corto con Gemini para identificar los 5 mejores "
            "momentos y extrae esos fotogramas como JPG usando ffmpeg."
        )
    )
    parser.add_argument(
        "video",
        type=str,
        help="Ruta al archivo de video local (mp4) a analizar.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=OUTPUT_DIR_DEFAULT,
        help=f"Carpeta de salida para los frames extraidos (default: {OUTPUT_DIR_DEFAULT}).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=MODELO_DEFAULT,
        help=f"Modelo de Gemini a usar (default: {MODELO_DEFAULT}).",
    )
    parser.add_argument(
        "--fallback-model",
        type=str,
        default=MODELO_FALLBACK_DEFAULT,
        help=f"Modelo de fallback si el principal falla (default: {MODELO_FALLBACK_DEFAULT}).",
    )

    args = parser.parse_args()

    video_path = Path(args.video).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    if not video_path.is_file():
        logger.error("No se encontro el archivo de video: %s", video_path)
        sys.exit(1)

    if shutil.which("ffmpeg") is None:
        logger.error(
            "ffmpeg no esta instalado o no se encuentra en el PATH. "
            "Instalalo desde https://ffmpeg.org/download.html antes de continuar."
        )
        sys.exit(1)

    logger.info("Analizando video con Gemini: %s", video_path)
    momentos_raw = analizar_video(
        video_path=video_path,
        model=args.model,
        fallback_model=args.fallback_model,
    )

    logger.info("Gemini devolvio %d momento(s). Extrayendo frames con ffmpeg...", len(momentos_raw))
    frames_extraidos = extraer_frames(
        video_path=video_path,
        momentos=momentos_raw,
        output_dir=output_dir,
    )

    print("\n" + "=" * 60)
    print(f"RESUMEN: {len(frames_extraidos)} highlight(s) extraido(s) de {video_path.name}")
    print("=" * 60)
    for i, frame in enumerate(frames_extraidos, start=1):
        print(f"\n[{i}] {frame['path']}")
        print(f"    Timestamp: {frame['timestamp']}")
        print(f"    Razon:     {frame['reason']}")
    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
