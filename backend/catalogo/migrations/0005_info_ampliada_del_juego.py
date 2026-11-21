from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogo", "0004_imagen_acepta_rutas"),
    ]

    operations = [
        migrations.AddField(
            model_name="producto",
            name="dificultad",
            field=models.CharField(
                blank=True,
                choices=[("facil", "Fácil"), ("media", "Media"), ("dificil", "Difícil")],
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="producto",
            name="componentes",
            field=models.TextField(blank=True, help_text="Qué trae la caja, una cosa por línea"),
        ),
        migrations.AddField(
            model_name="producto",
            name="preparacion",
            field=models.TextField(blank=True, help_text="Cómo se arma la mesa, un paso por línea"),
        ),
        migrations.AddField(
            model_name="producto",
            name="como_jugar",
            field=models.TextField(blank=True, help_text="Cómo se juega un turno, un paso por línea"),
        ),
        migrations.AddField(
            model_name="producto",
            name="como_ganar",
            field=models.TextField(blank=True, help_text="Cómo termina la partida y quién gana"),
        ),
        migrations.AddField(
            model_name="producto",
            name="consejos",
            field=models.TextField(blank=True, help_text="Trucos para la primera partida, uno por línea"),
        ),
        migrations.AddField(
            model_name="producto",
            name="video",
            field=models.CharField(
                blank=True,
                help_text="Enlace de YouTube que explica el juego (https://www.youtube.com/watch?v=...)",
                max_length=200,
            ),
        ),
    ]
