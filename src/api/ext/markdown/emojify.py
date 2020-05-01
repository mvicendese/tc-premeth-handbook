
import emoji

from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor


class EmojifyExtension(Extension):
	def extendMarkdown(self, md, md_globals):
		md.registerExtension(self)
		md.preprocessors.add('emojify', EmojifyPreprocessor(md), '_end')

REGEXP = emoji.get_emoji_regexp()

class EmojifyPreprocessor(Preprocessor):
	def run(self, lines):
		return [
			self.wrap_emotes(emoji.emojize(line, use_aliases=True))
			for line in lines
		]

	def wrap_emotes(self, line):
		"""
		Wraps all emoji characters in the line with a <span class="emoji"> element
		"""
		emoji_regexp = emoji.get_emoji_regexp()
		return emoji_regexp.sub(r'<span class="emoji">\1</span>', line)

def makeExtension(**kwargs):
	return EmojifyExtension(**kwargs)