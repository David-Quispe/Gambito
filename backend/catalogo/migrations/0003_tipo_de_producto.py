from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogo", "0002_descuento_y_ventas"),
    ]

    operations = [
        migrations.AddField(
            model_name="producto",
            name="tipo",
            field=models.CharField(
                choices=[
                    ("juego", "Juegos"),
                    ("miniatura", "Miniaturas"),
                    ("pintura", "Pinturas"),
                    ("micas", "Micas y fundas"),
                    ("peluche", "Peluches"),
                    ("recuerdo", "Recuerdos"),
                    ("dado", "Dados"),
                ],
                default="juego",
                max_length=15,
            ),
        ),
        migrations.AlterField(
            model_name="producto",
            name="imagen",
            field=models.URLField(
                blank=True,
                help_text="Enlace a la portada (si lo dejas vacío se usa una ilustración según el tipo)",
                max_length=500,
            ),
        ),
        migrations.AlterField(
            model_name="producto",
            name="jugadores",
            field=models.CharField(blank=True, help_text="Ej: 3-4", max_length=20),
        ),
        migrations.AlterField(
            model_name="producto",
            name="duracion",
            field=models.CharField(blank=True, help_text="Ej: 60-120 (minutos)", max_length=20),
        ),
        migrations.AlterField(
            model_name="producto",
            name="edad",
            field=models.CharField(blank=True, help_text="Ej: +10", max_length=10),
        ),
    ]
