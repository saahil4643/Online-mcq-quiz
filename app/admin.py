from django.contrib import admin

from .models import Choice, Question, Quiz


class ChoiceInline(admin.TabularInline):
	model = Choice
	extra = 1


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
	list_display = ('text', 'quiz', 'order')
	list_filter = ('quiz',)
	search_fields = ('text',)
	inlines = [ChoiceInline]


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
	list_display = ('title', 'slug', 'duration_minutes', 'is_active')
	list_filter = ('is_active',)
	prepopulated_fields = {'slug': ('title',)}
	search_fields = ('title',)
