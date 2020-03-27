# Generated by Django 3.0.4 on 2020-03-20 23:50

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('subjects', '0001_initial'),
        ('schools', '0001_initial')
    ]

    operations = [
        migrations.CreateModel(
            name='Assessment',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AssessmentSchema',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('type', models.CharField(max_length=64)),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.School')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Subject')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='UnitAssessmentAttempt',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('date', models.DateTimeField()),
                ('raw_mark', models.PositiveSmallIntegerField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LessonPrelearningAssessmentAttempt',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('date', models.DateTimeField()),
                ('completed', models.BooleanField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LessonOutcomeSelfAssessmentAttempt',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('date', models.DateTimeField()),
                ('rating', models.PositiveSmallIntegerField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='BlockAssessmentAttempt',
            fields=[
                ('id', models.UUIDField(primary_key=True, serialize=False)),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('date', models.DateTimeField()),
                ('raw_mark', models.PositiveSmallIntegerField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='assessment',
            name='schema',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='assessments.AssessmentSchema'),
        ),
        migrations.AddField(
            model_name='assessment',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Student'),
        ),
        migrations.CreateModel(
            name='UnitAssessmentSchema',
            fields=[
                ('assessmentschema_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='assessments.AssessmentSchema')),
                ('maximum_available_mark', models.PositiveSmallIntegerField()),
                ('unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Unit')),
            ],
            options={
                'abstract': False,
            },
            bases=('assessments.assessmentschema',),
        ),
        migrations.CreateModel(
            name='LessonPrelearningAssessmentSchema',
            fields=[
                ('assessmentschema_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='assessments.AssessmentSchema')),
                ('is_completed', models.BooleanField(default=False)),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Lesson')),
            ],
            options={
                'abstract': False,
            },
            bases=('assessments.assessmentschema',),
        ),
        migrations.CreateModel(
            name='LessonOutcomeSelfAssessmentSchema',
            fields=[
                ('assessmentschema_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='assessments.AssessmentSchema')),
                ('rating', models.PositiveSmallIntegerField(null=True)),
                ('lesson_outcome', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.LessonOutcome')),
            ],
            options={
                'abstract': False,
            },
            bases=('assessments.assessmentschema',),
        ),
        migrations.CreateModel(
            name='BlockAssessmentSchema',
            fields=[
                ('assessmentschema_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='assessments.AssessmentSchema')),
                ('maximum_available_mark', models.PositiveSmallIntegerField()),
                ('block', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Block')),
            ],
            options={
                'abstract': False,
            },
            bases=('assessments.assessmentschema',),
        ),
    ]
