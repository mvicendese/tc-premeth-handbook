from django.db import migrations
from django.conf import settings


def create_premeth_subject_tree(apps, schema_editor):
	Subject = apps.get_model('subjects', 'Subject')
	from api.subjects.models import SubjectNode

	premeth_subject = Subject.objects.get(name='PreMeth')

	subject_node = SubjectNode.add_subject(premeth_subject)
	print(f'Created {subject_node.get_children_count()}')


class Migration(migrations.Migration):

    dependencies = [
        ('subjects', '0004_subjectnode'),
    ]

    operations = [
    	migrations.RunPython(create_premeth_subject_tree, migrations.RunPython.noop)
    ]

