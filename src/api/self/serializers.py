from rest_framework import serializers

class PersonSerializer(BaseSerializer):
	school = serializers.UUIDField(source='school.id')

	class Meta:
		fields = BaseSerializer.Meta.fields + (
					'first_name',
					'surname',
					'full_name',
					'email',
					'school'
				 )

class PublicUserSerializer(serializers.ModelSerializer):


	class Meta:
