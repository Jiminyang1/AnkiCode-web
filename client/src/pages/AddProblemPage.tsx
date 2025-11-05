import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { fetchProblemDetail, searchProblems, type RemoteProblem, type RemoteProblemDetail } from '../api/leetcode';
import { useAuth } from '../context/AuthContext';
import type { Problem } from '../types';

type SearchState = 'idle' | 'searching' | 'error' | 'done';

const AddProblemPage = (): JSX.Element => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RemoteProblem[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<RemoteProblem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<RemoteProblemDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [nextReview, setNextReview] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery) {
        setSearchResults([]);
        setSearchState('idle');
        setSearchError(null);
        return;
      }

      setSearchState('searching');
      setSearchError(null);
      try {
        const results = await searchProblems(debouncedQuery);
        setSearchResults(results.slice(0, 20));
        setSearchState('done');
      } catch (error) {
        setSearchResults([]);
        setSearchState('error');
        setSearchError((error as Error).message);
      }
    };

    void performSearch();
  }, [debouncedQuery]);

  const handleSelectProblem = async (problem: RemoteProblem) => {
    setSelectedProblem(problem);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedDetail(null);
    setNotes('');

    try {
      const detail = await fetchProblemDetail(problem.titleSlug);
      setSelectedDetail(detail);
    } catch (error) {
      setDetailError('Unable to load extra details for this problem.');
      console.error('Failed to fetch remote problem detail', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const canSubmit = useMemo(
    () => Boolean(user && selectedProblem && nextReview && !saving),
    [user, selectedProblem, nextReview, saving],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedProblem) {
      setFormError('Pick a LeetCode problem before saving.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    const baseProblem = {
      leetcodeId: Number(selectedProblem.questionFrontendId),
      title: selectedProblem.title,
      difficulty: selectedProblem.difficulty,
      topic: selectedProblem.topicTags?.[0]?.name ?? 'General',
      nextReview,
      reviewIntervalDays: 1,
      userId: user.id,
    };

    try {
      const { data: createdProblem } = await apiClient.post<Problem>('/problems', {
        ...baseProblem,
        notes: notes.trim(),
      });

      setFormSuccess(
        `Added #${createdProblem.leetcodeId} ${createdProblem.title} to your queue${
          notes.trim() ? ' with notes' : ''
        }.`,
      );
      setSelectedProblem(null);
      setSelectedDetail(null);
      setQuery('');
      setDebouncedQuery('');
      setSearchResults([]);
      setNotes('');

      navigate('/dashboard', {
        replace: true,
        state: {
          flash: {
            type: 'success',
            message: `Added #${createdProblem.leetcodeId} ${createdProblem.title} to your queue${notes.trim() ? ' with notes' : ''}.`,
          },
        },
      });
    } catch (error) {
      console.error('Failed to save new problem', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError('This problem is already in your deck.');
      } else {
        setFormError('Unable to add this problem. Please try again.');
      }
      setSaving(false);
    }
  };

  return (
    <div className="add-problem">
      <header className="add-problem__header">
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1>Add a new problem</h1>
          <p>Search the LeetCode catalog, capture notes, and schedule the first review.</p>
        </div>
      </header>

      <section className="add-problem__search">
        <label className="form-field">
          <span>Search LeetCode by ID or title</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 53 or Maximum Subarray"
          />
        </label>
        {searchState === 'searching' && <div className="add-problem__hint">Searching…</div>}
        {searchState === 'error' && searchError && <div className="alert alert--error">{searchError}</div>}
        {searchState === 'done' && searchResults.length === 0 && (
          <div className="add-problem__hint">No matches yet. Try different keywords.</div>
        )}

        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((problem) => (
              <li key={problem.titleSlug}>
                <button
                  type="button"
                  className={`search-result ${selectedProblem?.titleSlug === problem.titleSlug ? 'search-result--active' : ''}`}
                  onClick={() => handleSelectProblem(problem)}
                >
                  <div className="search-result__title">
                    <span className={`badge ${getDifficultyBadge(problem.difficulty)}`}>{problem.difficulty}</span>
                    <span>
                      #{problem.questionFrontendId} · {problem.title}
                    </span>
                  </div>
                  {problem.topicTags && problem.topicTags.length > 0 && (
                    <div className="search-result__topics">
                      {problem.topicTags.slice(0, 3).map((tag) => (
                        <span key={tag.name} className="tag-chip">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="add-problem__form">
        <form onSubmit={handleSubmit} className="add-form">
          <fieldset disabled={!selectedProblem || saving}>
            <legend>Problem details</legend>

            <div className="add-form__summary">
              {selectedProblem ? (
                <>
                  <h2>
                    #{selectedProblem.questionFrontendId} · {selectedProblem.title}
                  </h2>
                  <p className="add-form__meta">
                    Difficulty:&nbsp;
                    <span className={`badge ${getDifficultyBadge(selectedProblem.difficulty)}`}>
                      {selectedProblem.difficulty}
                    </span>
                  </p>
                  {detailLoading && <p className="add-problem__hint">Fetching description…</p>}
                  {detailError && <p className="alert alert--error">{detailError}</p>}
                  {selectedDetail?.question && (
                    <article
                      className="add-form__preview"
                      dangerouslySetInnerHTML={{ __html: selectedDetail.question }}
                    />
                  )}
                </>
              ) : (
                <p className="add-problem__hint">Search above and choose a problem to continue.</p>
              )}
            </div>

            <label className="form-field">
              <span>First review date</span>
              <input type="date" value={nextReview} onChange={(event) => setNextReview(event.target.value)} required />
            </label>

            <label className="form-field">
              <span>Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Why is this problem interesting? What approach should future-you remember?"
                rows={6}
              />
            </label>
          </fieldset>

          {formError && <div className="alert alert--error">{formError}</div>}
          {formSuccess && <div className="alert alert--success">{formSuccess}</div>}

          <div className="form-actions">
            <button type="submit" className="button button--primary" disabled={!canSubmit}>
              {saving ? 'Saving…' : 'Add to AnkiCode'}
            </button>
            <button type="button" className="button button--secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const getDifficultyBadge = (difficulty: RemoteProblem['difficulty']) => {
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

export default AddProblemPage;

