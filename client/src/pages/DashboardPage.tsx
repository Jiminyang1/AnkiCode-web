import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Problem, ProblemDetail, ProblemWithDetail } from '../types';

const DashboardPage = (): JSX.Element => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [problems, setProblems] = useState<ProblemWithDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionState, setActionState] = useState<Record<string, 'review' | 'skip'>>({});

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const problemsResponse = await apiClient.get<ProblemWithDetail[]>(`/problems`);

        setProblems(problemsResponse.data);
      } catch (err) {
        console.error('Failed to load problems', err);
        setError('Unable to load problems. Confirm the API server is running.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProblems();
  }, [user]);

  useEffect(() => {
    const state = location.state as { flash?: { type: 'success' | 'error'; message: string } } | null;
    if (state?.flash) {
      setActionMessage(state.flash);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysProblems = useMemo(
    () => problems.filter((problem) => problem.nextReview <= todayIso),
    [problems, todayIso],
  );

  const setProblemInState = (updatedProblem: ProblemWithDetail) => {
    setProblems((prev) =>
      prev.map((problem) => (problem.id === updatedProblem.id ? { ...problem, ...updatedProblem } : problem)),
    );
  };

  const updateProblemDetailsInState = (problemId: string, details: ProblemDetail[]) => {
    setProblems((prev) =>
      prev.map((problem) =>
        problem.id === problemId
          ? {
              ...problem,
              problemDetails: details,
            }
          : problem,
      ),
    );
  };

  const handleMarkReviewed = async (problem: ProblemWithDetail) => {
    const today = new Date();
    const nextInterval = Math.min((problem.reviewIntervalDays ?? 1) * 2, MAX_INTERVAL_DAYS);
    const nextReviewDate = toISO(addDays(today, nextInterval));
    const primaryDetail = problem.problemDetails?.[0];

    setActionState((prev) => ({ ...prev, [problem.id]: 'review' }));
    setActionMessage(null);

    try {
      const [{ data: updatedProblem }, updatedDetail] = await Promise.all([
        apiClient.patch<ProblemWithDetail>(`/problems/${problem.id}`, {
          nextReview: nextReviewDate,
          reviewIntervalDays: nextInterval,
        }),
        primaryDetail
          ? apiClient
              .patch<ProblemDetail>(`/problemDetails/${primaryDetail.id}`, {
                lastReviewed: toISO(today),
              })
              .then((response) => response.data)
          : Promise.resolve<ProblemDetail | null>(null),
      ]);

      setProblemInState({
        ...problem,
        nextReview: updatedProblem.nextReview,
        reviewIntervalDays: updatedProblem.reviewIntervalDays,
      });

      if (primaryDetail || updatedDetail) {
        updateProblemDetailsInState(problem.id, updatedDetail ? [updatedDetail] : []);
      }

      setActionMessage({ type: 'success', text: 'Spaced repetition interval updated. Next review scheduled.' });
    } catch (err) {
      console.error('Failed to mark review complete', err);
      setActionMessage({ type: 'error', text: 'Unable to update this problem. Please try again.' });
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[problem.id];
        return next;
      });
    }
  };

  const handleSkip = async (problem: ProblemWithDetail) => {
    const tomorrow = toISO(addDays(new Date(), 1));
    setActionState((prev) => ({ ...prev, [problem.id]: 'skip' }));
    setActionMessage(null);

    try {
      const { data: updatedProblem } = await apiClient.patch<ProblemWithDetail>(`/problems/${problem.id}`, {
        nextReview: tomorrow,
      });

      setProblemInState({ ...problem, nextReview: updatedProblem.nextReview });
      setActionMessage({ type: 'success', text: 'Problem deferred until tomorrow.' });
    } catch (err) {
      console.error('Failed to skip review', err);
      setActionMessage({ type: 'error', text: 'Unable to defer this review. Try again soon.' });
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[problem.id];
        return next;
      });
    }
  };

  const renderProblemCard = (problem: ProblemWithDetail) => {
    const primaryDetail = problem.problemDetails?.[0];
    const currentAction = actionState[problem.id];
    const reviewing = currentAction === 'review';
    const skipping = currentAction === 'skip';

    return (
      <article key={problem.id} className="problem-card">
        <div className="problem-card__header">
          <div className="problem-card__title">
            <h3>
              #{problem.leetcodeId} · {problem.title}
            </h3>
          </div>
          <span className={`badge ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
        </div>
        <dl className="problem-card__meta">
          <div>
            <dt>Topic</dt>
            <dd>{problem.topic}</dd>
          </div>
          <div>
            <dt>Next review</dt>
            <dd>{problem.nextReview}</dd>
          </div>
        </dl>
        {primaryDetail?.notes && <p className="problem-card__notes">Notes: {primaryDetail.notes}</p>}
        <div className="review-actions">
          <button
            type="button"
            className="button button--primary button--sm"
            onClick={() => handleMarkReviewed(problem)}
            disabled={reviewing || skipping}
          >
            {reviewing ? 'Updating…' : 'Mark reviewed'}
          </button>
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => handleSkip(problem)}
            disabled={reviewing || skipping}
          >
            {skipping ? 'Deferring…' : 'Skip for tomorrow'}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Review schedule for {user?.name}</p>
        </div>
        <button type="button" className="button button--primary" onClick={() => navigate('/problems/new')}>
          Add new problem
        </button>
      </div>

      {actionMessage && (
        <div className={`dashboard__banner dashboard__banner--${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {loading && <div className="loading">Loading problems…</div>}

      {error && <div className="alert alert--error">{error}</div>}

      {!loading && !error && (
        <div className="dashboard__sections">
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h2>Today&apos;s reviews</h2>
            </div>
            {todaysProblems.length === 0 ? (
              <p className="empty-state">No problems scheduled for review today.</p>
            ) : (
              <div className="problem-grid">{todaysProblems.map((problem) => renderProblemCard(problem))}</div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h2>All saved problems</h2>
            </div>
            {problems.length === 0 ? (
              <p className="empty-state">No problems yet. Use the button above to add one.</p>
            ) : (
              <div className="problem-table__wrapper">
                <table className="problem-table">
                  <thead>
                    <tr>
                      <th scope="col">LeetCode ID</th>
                      <th scope="col">Title</th>
                      <th scope="col">Difficulty</th>
                      <th scope="col">Topic</th>
                      <th scope="col">Next review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => (
                      <tr key={problem.id} onClick={() => navigate(`/problems/${problem.id}`)}>
                        <td>#{problem.leetcodeId}</td>
                        <td>{problem.title}</td>
                        <td>
                          <span className={`badge ${getDifficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
                        </td>
                        <td>{problem.topic}</td>
                        <td>{problem.nextReview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="table-hint">Click a row to open the problem details.</p>
              </div>
            )}
          </section>
        </div>
      )}
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

export default DashboardPage;

const MAX_INTERVAL_DAYS = 30;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toISO = (date: Date): string => date.toISOString().split('T')[0];
