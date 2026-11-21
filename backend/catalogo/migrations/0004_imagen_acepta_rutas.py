from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogo", "0003_tipo_de_producto"),
    ]

    operations = [
        migrations.AlterField(
            model_name="producto",
            name="imagen",
            field=models.CharField(
                blank=True,
                help_text="Enlace https://... o ruta como /accesorios/dado.jpg (vacío = ilustración según el tipo)",
                max_length=500,
            ),
        ),
    ]
