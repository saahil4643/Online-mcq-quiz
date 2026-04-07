from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from .models import Quiz


def home_view(request):
	return render(request, 'index.html')


def auth_view(request):
	return render(request, 'auth.html')


def dashboard_view(request):
	return render(request, 'dashboard.html')


def result_view(request):
	return render(request, 'result.html')


def quiz_view(request):
	quiz = Quiz.objects.filter(is_active=True).first()
	return render(request, 'quiz.html', {'quiz': quiz})


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
