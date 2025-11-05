import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Problem, ProblemDetail, ProblemWithDetail } from '../types';

type FetchState = 'idle' | 'loading' | 'error' | 'ready';

const ProblemDetailPage = (): JSX.Element => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState<FetchState>('idle');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [detailIds, setDetailIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formattedNextReview = useMemo(() => problem?.nextReview ?? '—', [problem]);
  const formattedLastReviewed = useMemo(() => detail?.lastReviewed ?? 'Not reviewed yet', [detail]);

  useEffect(() => {
    if (!user || !problemId) {
      return;
    }

    const fetchDetail = async () => {
      setState('loading');
      setErrorMessage(null);
      try {
        const response = await apiClient.get<ProblemWithDetail>(`/problems/${problemId}`, {
          params: { _embed: 'problemDetails' },
        });

        const { problemDetails = [], ...rest } = response.data;

        if (rest.userId !== user.id) {
          throw new Error('Problem does not belong to the current user.');
        }

        const fetchedDetail = problemDetails[0] ?? null;

        setProblem(rest);
        setDetail(fetchedDetail);
        setDetailIds(problemDetails.map((d) => d.id));
        setNotes(fetchedDetail?.notes ?? '');
        setState('ready');
      } catch (err) {
        console.error('Failed to load problem detail', err);
        setErrorMessage('Unable to load this problem. Try again or return to the dashboard.');
        setState('error');
      }
    };

    void fetchDetail();
  }, [problemId, user]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problemId || !user) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const timestamp = new Date().toISOString().split('T')[0];

      if (detail) {
        const response = await apiClient.patch<ProblemDetail>(`/problemDetails/${detail.id}`, {
          notes,
          lastReviewed: timestamp,
        });
        setDetail(response.data);
        setStatusMessage('Notes updated successfully.');
      } else {
        const response = await apiClient.post<ProblemDetail>(`/problemDetails`, {
          id: crypto.randomUUID(),
          problemId,
          notes,
          lastReviewed: timestamp,
        });
        setDetail(response.data);
        setDetailIds((prev) => [response.data.id, ...prev]);
        setStatusMessage('Notes saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save notes', err);
      setErrorMessage('Unable to save notes. Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleDelete = async () => {
    if (!problem) {
      return;
    }

    const confirmed = window.confirm('Delete this problem and its notes? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await Promise.all(detailIds.map((detailId) => apiClient.delete(`/problemDetails/${detailId}`)));
      await apiClient.delete(`/problems/${problem.id}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Failed to delete problem', err);
      setErrorMessage('Unable to delete this problem. Please try again.');
      setSaving(false);
    }
  };

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="problem-detail">
        <button type="button" className="link-button" onClick={handleBack}>
          ← Back to dashboard
        </button>
        <div className="problem-detail__loading">Loading problem…</div>
      </div>
    );
  }

  if (state === 'error' || !problem) {
    return (
      <div className="problem-detail">
        <button type="button" className="link-button" onClick={handleBack}>
          ← Back to dashboard
        </button>
        <div className="alert alert--error">{errorMessage ?? 'Problem not found.'}</div>
      </div>
    );
  }

  return (
    <div className="problem-detail">
      <button type="button" className="link-button" onClick={handleBack}>
        ← Back to dashboard
      </button>

      <header className="problem-detail__header">
        <div>
          <h1>
            #{problem.leetcodeId} · {problem.title}
          </h1>
          <p>Next review: {formattedNextReview}</p>
        </div>
        <span className={`badge ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
      </header>

      <section className="problem-detail__meta">
        <div>
          <span className="label">Topic</span>
          <span className="value">{problem.topic}</span>
        </div>
        <div>
          <span className="label">Last reviewed</span>
          <span className="value">{formattedLastReviewed}</span>
        </div>
      </section>

      <section className="problem-detail__notes">
        <h2>Review notes</h2>
        <form onSubmit={handleSave} className="notes-form">
          <label>
            <span className="label">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Capture patterns, pitfalls, and hints for this problem."
              rows={8}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save notes'}
            </button>
            <button type="button" className="button button--danger" onClick={handleDelete} disabled={saving}>
              Delete problem
            </button>
            {statusMessage && <p className="status status--success">{statusMessage}</p>}
            {errorMessage && <p className="status status--error">{errorMessage}</p>}
          </div>
        </form>
      </section>
    </div>
  );
};

const getDifficultyClass = (difficulty: Problem['difficulty']) => {
  switch (difficulty) {
    case 'Easy':
      return 'badge--easy';
    case 'Medium':
      return 'badge--medium';
    case 'Hard':
      return 'badge--hard';
    default:
      return '';
  }
};

export default ProblemDetailPage;

