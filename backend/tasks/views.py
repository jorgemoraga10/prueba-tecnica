from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class TaskListCreateView(APIView):
    def get(self, request, *args, **kwargs):  # noqa: ARG002
        return Response(
            {"detail": "Not implemented."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    def post(self, request, *args, **kwargs):  # noqa: ARG002
        return Response(
            {"detail": "Not implemented."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class TaskDetailView(APIView):
    def patch(self, request, task_id: int, *args, **kwargs):  # noqa: ARG002
        return Response(
            {"detail": "Not implemented."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    def delete(self, request, task_id: int, *args, **kwargs):  # noqa: ARG002
        return Response(
            {"detail": "Not implemented."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
