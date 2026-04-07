from pathlib import Path

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from .models import Quiz


BASE_DIR = Path(__file__).resolve().parent.parent
ASSET_DIR = BASE_DIR / 'app' / 'static' / 'app'


def build_inline_assets(css_files=(), js_files=()):
	styles = []
	for relative_path in css_files:
		asset_path = ASSET_DIR / 'css' / relative_path
		styles.append(asset_path.read_text(encoding='utf-8'))

	scripts = []
	for relative_path in js_files:
		asset_path = ASSET_DIR / 'js' / relative_path
		scripts.append(asset_path.read_text(encoding='utf-8'))

	return {
		'inline_styles': '\n'.join(styles),
		'inline_scripts': '\n'.join(scripts),
	}


def home_view(request):
	context = build_inline_assets(css_files=('style.css', 'home.css'), js_files=('main.js',))
	return render(request, 'index.html', context)


def auth_view(request):
	context = build_inline_assets(css_files=('style.css', 'pages.css'), js_files=('main.js', 'auth.js'))
	return render(request, 'auth.html', context)


def dashboard_view(request):
	context = build_inline_assets(css_files=('style.css', 'pages.css'), js_files=('main.js', 'pages.js'))
	return render(request, 'dashboard.html', context)


def result_view(request):
	context = build_inline_assets(css_files=('style.css', 'pages.css'), js_files=('main.js', 'pages.js'))
	return render(request, 'result.html', context)


def quiz_view(request):
	quiz = Quiz.objects.filter(is_active=True).first()
	context = {'quiz': quiz}
	context.update(build_inline_assets(css_files=('style.css', 'pages.css'), js_files=('main.js', 'quiz.js')))
	return render(request, 'quiz.html', context)


def quiz_questions_api(request, slug):
	quiz = get_object_or_404(Quiz, slug=slug, is_active=True)
	questions = []

	for question in quiz.questions.prefetch_related('choices').all():
		choices = list(question.choices.all())
		answer_index = next((idx for idx, c in enumerate(choices) if c.is_correct), -1)
		questions.append(
			{
				'id': question.id,
				'question': question.text,
				'options': [choice.text for choice in choices],
				'answer': answer_index,
			}
		)

	return JsonResponse(
		{
			'quiz': {
				'id': quiz.id,
				'title': quiz.title,
				'slug': quiz.slug,
				'duration_minutes': quiz.duration_minutes,
			},
			'questions': questions,
		}
	)
