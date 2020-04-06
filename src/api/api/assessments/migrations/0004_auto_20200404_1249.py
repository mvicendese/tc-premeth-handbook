# Generated by Django 3.0.5 on 2020-04-04 12:49

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0009_auto_20200404_0811'),
        ('assessments', '0003_auto_20200403_1630'),
    ]

    operations = [
        migrations.RenameField(
            model_name='completionbasedreport',
            old_name='generated_at',
            new_name='updated_at',
        ),
        migrations.RenameField(
            model_name='ratingbasedreport',
            old_name='generated_at',
            new_name='updated_at',
        ),
        migrations.RemoveField(
            model_name='ratingbasedreport',
            name='_passed_candidate_ids',
        ),
        migrations.RemoveField(
            model_name='ratingbasedreport',
            name='best_acheived_rating',
        ),
        migrations.RemoveField(
            model_name='ratingbasedreport',
            name='best_rating_achieved_by',
        ),
        migrations.RemoveField(
            model_name='ratingbasedreport',
            name='passed_candidate_count',
        ),
        migrations.AddField(
            model_name='assessment',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='assessment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='assessmentschema',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='assessmentschema',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='completionattempt',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='completionattempt',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='completionbasedreport',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ratedattempt',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ratedattempt',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='ratingbasedreport',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='ratingbasedreport',
            name='maximum_acheived_rating',
            field=models.FloatField(null=True),
        ),
        migrations.AddField(
            model_name='ratingbasedreport',
            name='maximum_achieved_rating_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student'),
        ),
        migrations.AddField(
            model_name='ratingbasedreport',
            name='minimum_achieved_rating',
            field=models.FloatField(null=True),
        ),
        migrations.AddField(
            model_name='ratingbasedreport',
            name='minimum_achieved_rating_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='+', to='schools.Student'),
        ),
        migrations.AlterField(
            model_name='completionattempt',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='completionbasedreport',
            name='completed_candidate_count',
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='ratedattempt',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='ratingbasedreport',
            name='rating_average',
            field=models.FloatField(null=True),
        ),
        migrations.AlterField(
            model_name='ratingbasedreport',
            name='rating_std_dev',
            field=models.FloatField(null=True),
        ),
    ]
