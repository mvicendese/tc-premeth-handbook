# Generated by Django 3.0.4 on 2020-03-20 01:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Block',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=256)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Lesson',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=2)),
                ('name', models.CharField(max_length=256)),
                ('number', models.IntegerField()),
                ('block', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Block')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=32)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Unit',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=256)),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Subject')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LessonOutcome',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('description', models.TextField()),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Lesson')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LessonExample',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('description', models.TextField()),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Lesson')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='block',
            name='unit',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Unit'),
        ),
    ]
