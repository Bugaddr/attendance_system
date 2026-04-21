DROP TABLE IF EXISTS AttendanceRecords;
DROP TABLE IF EXISTS Sessions;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'teacher' or 'student'
  name TEXT NOT NULL,
  studentId TEXT, -- Only for students
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Sessions (
  id TEXT PRIMARY KEY,
  teacherId TEXT NOT NULL,
  teacherLat REAL NOT NULL,
  teacherLng REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  endedAt DATETIME,
  FOREIGN KEY(teacherId) REFERENCES Users(id)
);

CREATE TABLE AttendanceRecords (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  studentUserId TEXT NOT NULL,
  photoData TEXT NOT NULL,
  studentLat REAL NOT NULL,
  studentLng REAL NOT NULL,
  distanceMeters REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sessionId) REFERENCES Sessions(id),
  FOREIGN KEY(studentUserId) REFERENCES Users(id),
  UNIQUE(sessionId, studentUserId)
);
