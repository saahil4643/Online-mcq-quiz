from django.db import models


class Quiz(models.Model):
	title = models.CharField(max_length=200)
	slug = models.SlugField(unique=True)
	description = models.TextField(blank=True)
	duration_minutes = models.PositiveIntegerField(default=15)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['title']

	def __str__(self):
		return self.title


class Question(models.Model):
	quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
	text = models.TextField()
	order = models.PositiveIntegerField(default=1)

	class Meta:
		ordering = ['order', 'id']

	def __str__(self):
		return f"{self.quiz.title} - Q{self.order}"


class Choice(models.Model):
	question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
	text = models.CharField(max_length=255)
	is_correct = models.BooleanField(default=False)
	order = models.PositiveIntegerField(default=1)

	class Meta:
		ordering = ['order', 'id']

	def __str__(self):
		return self.text
