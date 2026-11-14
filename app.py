from flask import Flask, jsonify, request, render_template
import csv
from pathlib import Path

app = Flask(__name__)
DATA_FILE = Path(__file__).parent / 'data' / 'students.csv'
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
DATA_FILE.touch(exist_ok=True)

class Student:
    def __init__(self, student_id, attendance_pct, average_score, study_hours, group):
        self.student_id = str(student_id).strip()
        self.attendance_pct = float(attendance_pct)
        self.average_score = float(average_score)
        self.study_hours = float(study_hours)
        self.group = str(group).strip()

    def evaluate_support(self):
        reasons, high_priority = [], False
        if self.average_score < 40:
            reasons.append('Critical academic performance')
            high_priority = True
        if self.attendance_pct < 50:
            reasons.append('Very low attendance')
            high_priority = True
        elif self.average_score < 60:
            reasons.append('Academic improvement needed')
        if self.attendance_pct < 75:
            reasons.append('Attendance improvement needed')
        if self.study_hours < 5 and self.average_score < 70:
            reasons.append('Study habit improvement needed')
        if high_priority:
            status = 'HIGH PRIORITY'
        elif reasons:
            status = 'SUPPORT RECOMMENDED'
        else:
            status = 'NO IMMEDIATE SUPPORT FLAG'
        return status, reasons

    def to_dict(self):
        status, reasons = self.evaluate_support()
        return {'student_id': self.student_id, 'attendance_pct': self.attendance_pct,
                'average_score': self.average_score, 'study_hours': self.study_hours,
                'group': self.group, 'status': status, 'reasons': reasons}

    def to_row(self):
        return [self.student_id, self.attendance_pct, self.average_score, self.study_hours, self.group]


def load_students():
    students = []
    with DATA_FILE.open('r', newline='', encoding='utf-8-sig') as file:
        for row in csv.reader(file):
            if not row or not any(v.strip() for v in row):
                continue
            if row[0].strip().lower() == 'student_id':  # tolerate an optional header
                continue
            if len(row) != 5:
                continue
            try:
                student = Student(*row)
                if not student.student_id or not student.group:
                    continue
                if not 0 <= student.attendance_pct <= 100 or not 0 <= student.average_score <= 100 or student.study_hours < 0:
                    continue
                if not any(s.student_id.lower() == student.student_id.lower() for s in students):
                    students.append(student)
            except (ValueError, TypeError):
                continue
    return students


def save_students(students):
    with DATA_FILE.open('w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerows(student.to_row() for student in students)


def validate_student(data, student_id=None):
    sid = str(student_id if student_id is not None else data.get('student_id', '')).strip()
    group = str(data.get('group', '')).strip()
    if not sid:
        raise ValueError('Student ID cannot be empty.')
    if not group:
        raise ValueError('Student group cannot be empty.')
    try:
        attendance = float(data.get('attendance_pct'))
        score = float(data.get('average_score'))
        hours = float(data.get('study_hours'))
    except (TypeError, ValueError):
        raise ValueError('Attendance, average score, and study hours must be numbers.')
    if not 0 <= attendance <= 100:
        raise ValueError('Attendance must be between 0 and 100.')
    if not 0 <= score <= 100:
        raise ValueError('Average score must be between 0 and 100.')
    if hours < 0:
        raise ValueError('Study hours cannot be negative.')
    return Student(sid, attendance, score, hours, group)

@app.get('/')
def home():
    return render_template('index.html')

@app.get('/api/students')
def get_students():
    query = request.args.get('q', '').strip().lower()
    students = load_students()
    filtered = [s for s in students if query in s.student_id.lower() or query in s.group.lower()]
    return jsonify([s.to_dict() for s in filtered])

@app.post('/api/students')
def add_student():
    try:
        student = validate_student(request.get_json(silent=True) or {})
    except ValueError as error:
        return jsonify({'error': str(error)}), 400
    students = load_students()
    if any(s.student_id.lower() == student.student_id.lower() for s in students):
        return jsonify({'error': 'A student with this ID already exists.'}), 409
    students.append(student)
    try:
        save_students(students)
    except OSError as error:
        return jsonify({'error': f'Could not save student data: {error}'}), 500
    return jsonify(student.to_dict()), 201

@app.put('/api/students/<student_id>')
def update_student(student_id):
    try:
        updated = validate_student(request.get_json(silent=True) or {}, student_id)
    except ValueError as error:
        return jsonify({'error': str(error)}), 400
    students = load_students()
    for i, student in enumerate(students):
        if student.student_id.lower() == student_id.lower():
            students[i] = updated
            save_students(students)
            return jsonify(updated.to_dict())
    return jsonify({'error': 'Student not found.'}), 404

@app.delete('/api/students/<student_id>')
def delete_student(student_id):
    students = load_students()
    remaining = [s for s in students if s.student_id.lower() != student_id.lower()]
    if len(remaining) == len(students):
        return jsonify({'error': 'Student not found.'}), 404
    save_students(remaining)
    return jsonify({'message': 'Student deleted successfully.'})

@app.get('/api/analytics')
def analytics():
    students = load_students()
    count = len(students)
    if not count:
        return jsonify({'total_students': 0, 'average_score': 0, 'average_attendance': 0,
                        'average_study_hours': 0, 'highest_scorer': None, 'high_priority_count': 0,
                        'support_count': 0, 'no_flag_count': 0})
    statuses = [s.evaluate_support()[0] for s in students]
    highest = max(students, key=lambda s: s.average_score)
    return jsonify({'total_students': count,
        'average_score': round(sum(s.average_score for s in students) / count, 2),
        'average_attendance': round(sum(s.attendance_pct for s in students) / count, 2),
        'average_study_hours': round(sum(s.study_hours for s in students) / count, 2),
        'highest_scorer': {'student_id': highest.student_id, 'average_score': highest.average_score},
        'high_priority_count': statuses.count('HIGH PRIORITY'),
        'support_count': statuses.count('SUPPORT RECOMMENDED'),
        'no_flag_count': statuses.count('NO IMMEDIATE SUPPORT FLAG')})

if __name__ == '__main__':
    app.run(debug=True)
