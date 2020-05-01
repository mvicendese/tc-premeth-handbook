# Generated by Django 3.0.5 on 2020-04-28 18:34

import api.assessments.attempts.models
import api.subjects.models
from django.db import migrations, models
import django.db.models.deletion
import django.db.models.manager
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('subjects', '0003_data_prepopulate_subject_tree'),
        ('schools', '0005_data_create_users'),
    ]

    operations = [
        migrations.CreateModel(
            name='Assessment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            managers=[
                ('unit_assessments', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='AssessmentSchema',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('type', models.CharField(max_length=64, unique=True)),
                ('subject_node_type', api.subjects.models.SubjectNodeTypeField()),
                ('attempt_type', api.assessments.attempts.models.AttemptTypeField()),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.School')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='subjects.Subject')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RatedReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_candidate_ids', models.TextField(default='')),
                ('_attempt_candidate_ids', models.TextField(default='')),
                ('rating_average', models.DecimalField(decimal_places=2, max_digits=5, null=True)),
                ('rating_std_dev', models.DecimalField(decimal_places=2, max_digits=5, null=True)),
                ('_candidate_ratings', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('subject_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.SubjectClass')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RatedProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_assessment_ids', models.TextField(default='')),
                ('_attempted_assessment_ids', models.TextField(default='')),
                ('_assessment_ratings', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='RatedAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('attempt_type', api.assessments.attempts.models.AttemptTypeField()),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('rating', api.assessments.attempts.models.RatingField(max_rating_field='max_available_rating')),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='PassFailReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_candidate_ids', models.TextField(default='')),
                ('_attempt_candidate_ids', models.TextField(default='')),
                ('_passed_candidate_ids', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('subject_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.SubjectClass')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='PassFailProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_assessment_ids', models.TextField(default='')),
                ('_attempted_assessment_ids', models.TextField(default='')),
                ('_passed_assessments', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='PassFailAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('attempt_type', api.assessments.attempts.models.AttemptTypeField()),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('state', api.assessments.attempts.models.PassFailStateField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GradedReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_candidate_ids', models.TextField(default='')),
                ('_attempt_candidate_ids', models.TextField(default='')),
                ('_grade_f_candidate_ids', models.TextField(default='')),
                ('_grade_d_plus_candidate_ids', models.TextField(default='')),
                ('_grade_d_candidate_ids', models.TextField(default='')),
                ('_grade_d_minus_candidate_ids', models.TextField(default='')),
                ('_grade_c_plus_candidate_ids', models.TextField(default='')),
                ('_grade_c_candidate_ids', models.TextField(default='')),
                ('_grade_c_minus_candidate_ids', models.TextField(default='')),
                ('_grade_b_minus_candidate_ids', models.TextField(default='')),
                ('_grade_b_candidate_ids', models.TextField(default='')),
                ('_grade_b_plus_candidate_ids', models.TextField(default='')),
                ('_grade_a_minus_candidate_ids', models.TextField(default='')),
                ('_grade_a_candidate_ids', models.TextField(default='')),
                ('_grade_a_plus_candidate_ids', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('subject_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.SubjectClass')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GradedProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_assessment_ids', models.TextField(default='')),
                ('_attempted_assessment_ids', models.TextField(default='')),
                ('_grade_f_assessment_ids', models.TextField(default='')),
                ('_grade_d_plus_assessment_ids', models.TextField(default='')),
                ('_grade_d_assessment_ids', models.TextField(default='')),
                ('_grade_d_minus_assessment_ids', models.TextField(default='')),
                ('_grade_c_plus_assessment_ids', models.TextField(default='')),
                ('_grade_c_assessment_ids', models.TextField(default='')),
                ('_grade_c_minus_assessment_ids', models.TextField(default='')),
                ('_grade_b_minus_assessment_ids', models.TextField(default='')),
                ('_grade_b_assessment_ids', models.TextField(default='')),
                ('_grade_b_plus_assessment_ids', models.TextField(default='')),
                ('_grade_a_minus_assessment_ids', models.TextField(default='')),
                ('_grade_a_assessment_ids', models.TextField(default='')),
                ('_grade_a_plus_assessment_ids', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GradedAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('attempt_type', api.assessments.attempts.models.AttemptTypeField()),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('grade', api.assessments.attempts.models.GradeStateField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CompletionBasedReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_candidate_ids', models.TextField(default='')),
                ('_attempt_candidate_ids', models.TextField(default='')),
                ('_partially_complete_candidate_ids', models.TextField(default='')),
                ('_complete_candidate_ids', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('subject_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.SubjectClass')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CompletionBasedProgress',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('generated_at', models.DateTimeField(null=True)),
                ('generation', models.PositiveSmallIntegerField(default=1)),
                ('_assessment_ids', models.TextField(default='')),
                ('_attempted_assessment_ids', models.TextField(default='')),
                ('_partially_complete_assessments', models.TextField(default='')),
                ('_complete_assessments', models.TextField(default='')),
                ('assessment_schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student')),
                ('subject_node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CompletionBasedAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('attempt_type', api.assessments.attempts.models.AttemptTypeField()),
                ('attempt_number', models.PositiveSmallIntegerField()),
                ('state', api.assessments.attempts.models.PartialCompletionStateField()),
                ('assessment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.Assessment')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='AssessmentOptions',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('_ratedattempt_max_available_rating', models.PositiveSmallIntegerField(null=True)),
                ('schema', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema')),
                ('subject_node', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode')),
            ],
        ),
        migrations.AddField(
            model_name='assessment',
            name='schema',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='assessments.AssessmentSchema'),
        ),
        migrations.AddField(
            model_name='assessment',
            name='student',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student'),
        ),
        migrations.AddField(
            model_name='assessment',
            name='subject_node',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to='subjects.SubjectNode'),
        ),
        migrations.AddIndex(
            model_name='ratedreport',
            index=models.Index(fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'], name='index_ratedreport'),
        ),
        migrations.AddConstraint(
            model_name='ratedreport',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'subject_node_id', 'subject_class_id'), name='unique_ratedreport'),
        ),
        migrations.AddConstraint(
            model_name='ratedreport',
            constraint=models.UniqueConstraint(condition=models.Q(subject_class_id=None), fields=('assessment_schema_id', 'subject_node_id'), name='unique_wo_class_ratedreport'),
        ),
        migrations.AddIndex(
            model_name='ratedprogress',
            index=models.Index(fields=['assessment_schema_id', 'student_id', 'subject_node_id'], name='index_ratedprogress'),
        ),
        migrations.AddConstraint(
            model_name='ratedprogress',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'student_id', 'subject_node_id'), name='index_ratedprogress'),
        ),
        migrations.AddIndex(
            model_name='passfailreport',
            index=models.Index(fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'], name='index_passfailreport'),
        ),
        migrations.AddConstraint(
            model_name='passfailreport',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'subject_node_id', 'subject_class_id'), name='unique_passfailreport'),
        ),
        migrations.AddConstraint(
            model_name='passfailreport',
            constraint=models.UniqueConstraint(condition=models.Q(subject_class_id=None), fields=('assessment_schema_id', 'subject_node_id'), name='unique_wo_class_passfailreport'),
        ),
        migrations.AddIndex(
            model_name='passfailprogress',
            index=models.Index(fields=['assessment_schema_id', 'student_id', 'subject_node_id'], name='index_passfailprogress'),
        ),
        migrations.AddConstraint(
            model_name='passfailprogress',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'student_id', 'subject_node_id'), name='index_passfailprogress'),
        ),
        migrations.AddIndex(
            model_name='gradedreport',
            index=models.Index(fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'], name='index_gradedreport'),
        ),
        migrations.AddConstraint(
            model_name='gradedreport',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'subject_node_id', 'subject_class_id'), name='unique_gradedreport'),
        ),
        migrations.AddConstraint(
            model_name='gradedreport',
            constraint=models.UniqueConstraint(condition=models.Q(subject_class_id=None), fields=('assessment_schema_id', 'subject_node_id'), name='unique_wo_class_gradedreport'),
        ),
        migrations.AddIndex(
            model_name='gradedprogress',
            index=models.Index(fields=['assessment_schema_id', 'student_id', 'subject_node_id'], name='index_gradedprogress'),
        ),
        migrations.AddConstraint(
            model_name='gradedprogress',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'student_id', 'subject_node_id'), name='index_gradedprogress'),
        ),
        migrations.AddIndex(
            model_name='completionbasedreport',
            index=models.Index(fields=['assessment_schema_id', 'subject_node_id', 'subject_class_id'], name='index_completionbasedreport'),
        ),
        migrations.AddConstraint(
            model_name='completionbasedreport',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'subject_node_id', 'subject_class_id'), name='unique_completionbasedreport'),
        ),
        migrations.AddConstraint(
            model_name='completionbasedreport',
            constraint=models.UniqueConstraint(condition=models.Q(subject_class_id=None), fields=('assessment_schema_id', 'subject_node_id'), name='unique_wo_class_completionbasedreport'),
        ),
        migrations.AddIndex(
            model_name='completionbasedprogress',
            index=models.Index(fields=['assessment_schema_id', 'student_id', 'subject_node_id'], name='index_completionbasedprogress'),
        ),
        migrations.AddConstraint(
            model_name='completionbasedprogress',
            constraint=models.UniqueConstraint(fields=('assessment_schema_id', 'student_id', 'subject_node_id'), name='index_completionbasedprogress'),
        ),
        migrations.AddIndex(
            model_name='assessmentoptions',
            index=models.Index(fields=['schema_id', 'subject_node_id'], name='index_schema_node'),
        ),
        migrations.AddConstraint(
            model_name='assessmentoptions',
            constraint=models.UniqueConstraint(fields=('schema_id', 'subject_node_id'), name='unique_schema_node'),
        ),
        migrations.AddConstraint(
            model_name='assessmentoptions',
            constraint=models.UniqueConstraint(condition=models.Q(subject_node_id=None), fields=('schema_id',), name='unique_schema_default'),
        ),
        migrations.AddIndex(
            model_name='assessment',
            index=models.Index(fields=['schema_id', 'student_id'], name='index_ass_schema_student'),
        ),
        migrations.AddIndex(
            model_name='assessment',
            index=models.Index(fields=['schema_id', 'subject_node_id'], name='index_ass_schema_node'),
        ),
        migrations.AddIndex(
            model_name='assessment',
            index=models.Index(fields=['schema_id', 'subject_node_id', 'student_id'], name='index_ass_schema_student_node'),
        ),
        migrations.AddConstraint(
            model_name='assessment',
            constraint=models.UniqueConstraint(fields=('schema_id', 'student_id', 'subject_node_id'), name='unique_assessment'),
        ),
    ]
