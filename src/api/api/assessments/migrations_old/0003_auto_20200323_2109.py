# Generated by Django 3.0.4 on 2020-03-23 21:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0002_data_import_block_assessments'),
    ]

    operations = [
        migrations.RenameField(
            model_name='assessment',
            old_name='schema',
            new_name='schema_base',
        ),
    ]
