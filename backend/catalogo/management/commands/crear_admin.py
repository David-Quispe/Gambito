from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Crea (o actualiza) la cuenta de administrador de la tienda Gambito'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--email', default='admin@gambito.example')
        # La contraseña no está en el código para que no termine en GitHub
        parser.add_argument('--password', required=True)

    def handle(self, *args, **opciones):
        User = get_user_model()
        if len(opciones['password']) < 8:
            raise CommandError('La contraseña debe tener al menos 8 caracteres.')

        usuario, creado = User.objects.get_or_create(
            username=opciones['username'], defaults={'email': opciones['email']}
        )
        usuario.email = opciones['email']
        usuario.is_staff = True
        usuario.is_superuser = True
        usuario.set_password(opciones['password'])
        usuario.save()

        accion = 'creada' if creado else 'actualizada'
        self.stdout.write(self.style.SUCCESS(
            f'Cuenta de administrador {accion}: usuario "{usuario.username}", correo {usuario.email}.'
        ))
