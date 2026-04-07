from django.core.management.base import BaseCommand
from django.utils.text import slugify

from app.models import Choice, Question, Quiz


SAMPLE_QUESTIONS = [
    {
        'question': 'What does CPU stand for?',
        'options': [
            'Central Processing Unit',
            'Computer Personal Unit',
            'Central Program Utility',
            'Control Processing Unit',
        ],
        'answer': 0,
    },
    {
        'question': 'Which of the following is an input device?',
        'options': ['Monitor', 'Printer', 'Keyboard', 'Speaker'],
        'answer': 2,
    },
    {
        'question': 'Which part of the computer is called the brain of the computer?',
        'options': [
            'Monitor',
            'CPU',
            'Keyboard',
            'Mouse',
        ],
        'answer': 0,
    },
    {
        'question': 'Which of the following is system software?',
        'options': ['MS Word', 'Paint', 'Operating System', 'Calculator'],
        'answer': 2,
    },
    {
        'question': 'What does RAM stand for?',
        'options': ['Read Access Memory', 'Random Access Memory', 'Run Access Memory', 'Real Access Memory'],
        'answer': 1,
    },
    {
        'question': 'Which of the following is NOT a programming language?',
        'options': ['Python', 'Java', 'HTML', 'Mouse'],
        'answer': 3,
    },
    {
        'question': 'Which device is used to display output?',
        'options': ['Keyboard', 'Mouse', 'Monitor', 'Scanner'],
        'answer': 2,
    },
    {
        'question': 'What is the full form of OS?',
        'options': ['Open Software', 'Operating System', 'Output System', 'Order Software'],
        'answer': 1,
    },
    {
        'question': 'Which of the following is secondary storage?',
        'options': ['RAM', 'Cache', 'Hard Disk', 'Register'],
        'answer': 2,
    },
    {
        'question': 'Which language is used to create web pages?',
        'options': ['C', 'Java', 'HTML', 'Python'],
        'answer': 1,
    },
]


class Command(BaseCommand):
    help = 'Seed MySQL with a sample quiz and questions'

    def add_arguments(self, parser):
        parser.add_argument('--title', default='Computer Basics', help='Quiz title')

    def handle(self, *args, **options):
        title = options['title']
        quiz, _ = Quiz.objects.get_or_create(
            slug=slugify(title),
            defaults={
                'title': title,
                'description': 'Starter quiz for computer basics',
                'duration_minutes': 15,
                'is_active': True,
            },
        )

        for index, item in enumerate(SAMPLE_QUESTIONS, start=1):
            question, _ = Question.objects.get_or_create(
                quiz=quiz,
                order=index,
                defaults={'text': item['question']},
            )
            if question.text != item['question']:
                question.text = item['question']
                question.save(update_fields=['text'])

            for opt_index, option_text in enumerate(item['options'], start=1):
                choice, _ = Choice.objects.get_or_create(
                    question=question,
                    order=opt_index,
                    defaults={'text': option_text, 'is_correct': item['answer'] == (opt_index - 1)},
                )
                expected_correct = item['answer'] == (opt_index - 1)
                if choice.text != option_text or choice.is_correct != expected_correct:
                    choice.text = option_text
                    choice.is_correct = expected_correct
                    choice.save(update_fields=['text', 'is_correct'])

        self.stdout.write(self.style.SUCCESS(f"Seeded quiz '{quiz.title}' with sample questions."))
