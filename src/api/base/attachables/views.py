from uuid import uuid4

from rest_framework.response import Response
from .serializers import CommentSerializer


class CommentableModelMixin:
	"""
	Adds 'list_comments' and 'create_comment' methods to the view, 
	"""

	def list_comments(self, request, *args, **kwargs):
		attached_to = self.get_object()
		if attached_to._state.adding:
			# Fixme: Create attached to before running
			raise Http404

		if not hasattr(attached_to, 'comments'):
			raise AttributeError('attachable must implement \'comments\'')

		page = self.paginate_queryset(attached_to.comments.all())

		serializer = CommentSerializer(many=True)(page)
		return Response(serializer.data)

	def create_comment(self, request, *args, **kwargs):
		if request.method == 'PUT':
			if 'id' not in request.query_params:
				raise ValidationError('An id is required when putting a model')
			model_id = request.params.get('id')
		elif request.method == 'POST':	
			if 'id' in request.query_params:
				raise ValidationError('An id cannot be provided on post requests')
			model_id = uuid4()
		else:
			raise AssertionError(f'Invalid method for create_comment view {request.method}')


		attached_to = self.get_object()
		if attached_to._state.adding:
			raise Http404

		data = dict(
			id=model_id,
			attached_to=attached_to, 
			created_by=request.user,
		)
		data.update(request.data)

		serializer = CommentSerializer(data=data)

		import pdb; pdb.set_trace()
		serializer.is_valid(raise_exception=True)
		comment = serializer.save()

		return Response(data=serializer.data, status=201)


