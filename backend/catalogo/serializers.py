import re

from rest_framework import serializers

from .models import Categoria, Producto

# Saca el código de 11 caracteres de un enlace de YouTube (watch, youtu.be, embed...)
_YOUTUBE = re.compile(r'(?:v=|youtu\.be/|embed/|^)([A-Za-z0-9_-]{11})(?:[&?/]|$)')


def id_de_youtube(enlace):
    coincidencia = _YOUTUBE.search((enlace or '').strip())
    return coincidencia.group(1) if coincidencia else ''


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']


class ProductoSerializer(serializers.ModelSerializer):
    # El frontend recibe el nombre de la categoría como texto
    categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    precio = serializers.FloatField()
    precio_final = serializers.FloatField(read_only=True)
    en_oferta = serializers.BooleanField(read_only=True)
    stock_bajo = serializers.BooleanField(read_only=True)
    tipo_nombre = serializers.CharField(source='get_tipo_display', read_only=True)
    dificultad_nombre = serializers.CharField(source='get_dificultad_display', read_only=True)
    video_id = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'descuento', 'precio_final',
            'en_oferta', 'imagen', 'categoria', 'stock', 'stock_bajo', 'ventas',
            'jugadores', 'duracion', 'edad', 'tipo', 'tipo_nombre',
            'dificultad', 'dificultad_nombre', 'componentes', 'preparacion',
            'como_jugar', 'como_ganar', 'consejos', 'video_id',
        ]

    def get_video_id(self, producto):
        return id_de_youtube(producto.video)

    def to_representation(self, instance):
        datos = super().to_representation(instance)
        # Sin portada propia: el frontend usa la ilustración de su tipo (/tipos/<tipo>.svg)
        if not datos['imagen']:
            datos['imagen'] = f'/tipos/{instance.tipo}.svg'
        return datos
