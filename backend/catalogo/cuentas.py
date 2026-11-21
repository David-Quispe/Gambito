"""Registro, inicio de sesión y datos de la cuenta.

Hay dos tipos de cuenta:
  - comprador: cualquiera que se registra desde la página (is_staff = False)
  - administrador: se crea con `python manage.py crear_admin` o se marca como
    "staff" desde /admin/. Nunca se puede crear desde el registro público.
"""
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as ErrorDjango
from django.core.validators import validate_email
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


def datos_usuario(usuario):
    return {
        'id': usuario.id,
        'username': usuario.username,
        'email': usuario.email,
        'es_admin': usuario.is_staff,
    }


def respuesta_con_token(usuario, codigo=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=usuario)
    return Response({'token': token.key, 'usuario': datos_usuario(usuario)}, status=codigo)


class RegistroSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=30)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_username(self, valor):
        valor = valor.strip()
        # El validador de Django solo deja letras, números y @ . + - _
        try:
            User._meta.get_field('username').run_validators(valor)
        except ErrorDjango as e:
            raise serializers.ValidationError(e.messages[0])
        if User.objects.filter(username__iexact=valor).exists():
            raise serializers.ValidationError('Ese nombre de usuario ya está en uso.')
        return valor

    def validate_email(self, valor):
        valor = valor.strip().lower()
        try:
            validate_email(valor)
        except ErrorDjango:
            raise serializers.ValidationError('Escribe un correo válido.')
        if User.objects.filter(email__iexact=valor).exists():
            raise serializers.ValidationError('Ya existe una cuenta con ese correo.')
        return valor

    def validate_password(self, valor):
        try:
            validate_password(valor)
        except ErrorDjango as e:
            raise serializers.ValidationError(list(e.messages))
        return valor


class RegistroView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializador = RegistroSerializer(data=request.data)
        serializador.is_valid(raise_exception=True)
        datos = serializador.validated_data
        # is_staff queda en False: el registro público nunca crea administradores
        usuario = User.objects.create_user(
            username=datos['username'], email=datos['email'], password=datos['password'],
        )
        return respuesta_con_token(usuario, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        """Body: {"identificador": "usuario o correo", "password": "..."}"""
        identificador = str(request.data.get('identificador', '')).strip()
        password = request.data.get('password') or ''
        if not identificador or not password:
            return Response({'detalle': 'Escribe tu usuario o correo y tu contraseña.'}, status=400)

        username = identificador
        if '@' in identificador:
            coincidencias = User.objects.filter(email__iexact=identificador)
            if coincidencias.count() == 1:
                username = coincidencias.first().username

        usuario = authenticate(request, username=username, password=password)
        if usuario is None:
            # Mismo mensaje para usuario inexistente o contraseña mala
            return Response({'detalle': 'Usuario o contraseña incorrectos.'}, status=400)
        return respuesta_con_token(usuario)


class YoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(datos_usuario(request.user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
