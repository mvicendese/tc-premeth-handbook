from collections import OrderedDict

from rest_framework.response import Response
from rest_framework import pagination


class PageNumberPagination(pagination.PageNumberPagination):
	def get_paginated_response(self, data):
		return Response(OrderedDict([
			('count', self.page.paginator.count),
			('page_number', self.page.number),
			('next', self.get_next_link()),
			('previous', self.get_previous_link()),
			('results', data)
		]))

	def get_paginated_response_schema(self, schema):
		s = super().get_paginated_response_schema(schema)
		s['properties']['page_number'] = {
			'type': 'integer',	
			'example': 1
		}


