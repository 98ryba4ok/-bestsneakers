# Generated by Django 4.2.19 on 2025-06-16 17:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bestsneakers', '0004_alter_review_rating'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='address',
            field=models.TextField(default='адрес по умолчанию'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='order',
            name='full_name',
            field=models.CharField(default='адрес по умолчанию', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='order',
            name='phone',
            field=models.CharField(default='не указан', max_length=20),
            preserve_default=False,
        ),
    ]
