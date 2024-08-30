from django.shortcuts import render

from django.shortcuts import render, redirect
from .forms import UserInputForm
from .models import Course

def course_matcher(request):
    if request.method == 'POST':
        form = UserInputForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('results')
    else:
        form = UserInputForm()
    return render(request, 'matcher/matcher_form.html', {'form': form})

def results(request):
    matched_courses = Course.objects.all()  # Replace with actual matching logic
    return render(request, 'matcher/results.html', {'courses': matched_courses})
