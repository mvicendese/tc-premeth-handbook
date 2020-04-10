# Generated by Django 3.0.5 on 2020-04-09 10:25

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0009_auto_20200404_0811'),
        ('assessments', '0005_auto_20200405_0519'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='completionattempt',
            name='is_completed',
        ),
        migrations.AddField(
            model_name='completionattempt',
            name='completion_state',
            field=models.CharField(default='no', max_length=8),
        ),
        migrations.CreateModel(
            name='StateMachineReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('generation', models.PositiveIntegerField(default=0)),
                ('_candidate_ids', models.TextField(default='')),
                ('_attempted_candidate_ids', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.AssessmentSchema')),
                ('subject_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='schools.SubjectClass')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]