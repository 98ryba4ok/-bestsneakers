import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Participant {
  id: number;
  username: string;
}

interface Elexam {
  id: number;
  name: string;
  created_at: string;
  exam_date: string;
  image: string;
  participants: Participant[];
  is_public: boolean;
}

const ElexamPage: React.FC = () => {
  const [exams, setExams] = useState<Elexam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Elexam[]>('http://127.0.0.1:8000/api/elexams/') 
      .then((res) => {
        const publicExams = res.data.filter(exam => exam.is_public);
        setExams(publicExams);
      })
      .catch((err) => console.error('Ошибка при загрузке экзаменов:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Линников Егор Владиславович — группа 231-323
      </h1>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Опубликованные экзамены:
      </h2>

      {loading ? (
        <p>Загрузка...</p>
      ) : exams.length === 0 ? (
        <p>Нет опубликованных экзаменов.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {exams.map((exam) => (
            <li key={exam.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <p><strong>Название:</strong> {exam.name}</p>
              <p><strong>Дата создания:</strong> {new Date(exam.created_at).toLocaleDateString()}</p>
              <p><strong>Дата экзамена:</strong> {new Date(exam.exam_date).toLocaleDateString()}</p>
              <p><strong>Участники:</strong> {exam.participants.map(p => p.username).join(', ') || 'Нет участников'}</p>
              <div>
                <strong>Изображение:</strong><br />
                <img
                  src={exam.image}
                  alt="Изображение экзамена"
                  style={{ maxWidth: '300px', marginTop: '0.5rem' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ElexamPage;
