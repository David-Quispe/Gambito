from django.core.management.base import BaseCommand

from catalogo.models import Producto

from .info_juegos import INFO

LISTAS = ('componentes', 'preparacion', 'como_jugar', 'consejos')


class Command(BaseCommand):
    help = 'Carga la información ampliada de los juegos (solo rellena los campos vacíos).'

    def handle(self, *args, **opciones):
        completados = 0
        for nombre, datos in INFO.items():
            producto = Producto.objects.filter(nombre=nombre).first()
            if producto is None:
                self.stdout.write(f'  - {nombre}: no está en el catálogo, se omite')
                continue
            cambios = []
            for campo, valor in datos.items():
                if campo in LISTAS:
                    valor = '\n'.join(valor)
                if not getattr(producto, campo):
                    setattr(producto, campo, valor)
                    cambios.append(campo)
            if cambios:
                producto.save(update_fields=cambios)
                completados += 1
        self.stdout.write(self.style.SUCCESS(f'Juegos con información nueva: {completados}'))
