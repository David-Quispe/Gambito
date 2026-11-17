from rest_framework import serializers

from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']


class ProductoSerializer(serializers.ModelSerializer):
    # El frontend recibe el nombre de la categoría como texto
    categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    precio = serializers.FloatField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'imagen', 'categoria',
            'stock', 'jugadores', 'duracion', 'edad',
        ]
