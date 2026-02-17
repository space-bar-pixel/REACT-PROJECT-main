export default function StudentItem({ student }) {
  return (
    <div className="student-item">
      <h2>{student.name}</h2>
      <p>Age: {student.age}</p>
      <p>Grade: {student.grade}</p>
    </div>
  )
}