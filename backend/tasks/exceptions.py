from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):  # noqa: ARG001
    # Convierte errores de DRF al mismo contrato JSON del resto de la API.
    response = exception_handler(exc, context)
    if response is None:
        return None

    errors = response.data
    message = "La solicitud no pudo ser procesada."

    if response.status_code == 404:
        message = "El recurso solicitado no existe."
    elif response.status_code == 405:
        message = "El metodo HTTP no esta permitido para este endpoint."
    elif response.status_code == 400:
        message = "La solicitud contiene datos invalidos."

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }
    return response
