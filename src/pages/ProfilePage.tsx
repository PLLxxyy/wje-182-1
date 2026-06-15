import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, getFavorites, toggleFavorite, getMonthlyStats, getFeedbacks, deleteFeedback } from '../utils/storage';
import { mockStations } from '../utils/data';
import { ChargingSession, Feedback } from '../types';

type ProfileTab = 'history' | 'favorites' | 'stats' | 'feedbacks';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>('stats');
  const [history, setHistory] = useState<ChargingSession[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const refreshData = () => {
    setHistory(getHistory());
    setFavorites(getFavorites());
    setFeedbacks(getFeedbacks());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const monthlyStats = useMemo(() => getMonthlyStats(history), [history]);

  const totalCost = useMemo(() => history.reduce((sum, s) => sum + s.cost, 0), [history]);
  const totalEnergy = useMemo(() => history.reduce((sum, s) => sum + s.energyUsed, 0), [history]);
  const totalSessions = history.length;

  const favoriteStations = useMemo(
    () => mockStations.filter(s => favorites.includes(s.id)),
    [favorites]
  );

  const handleRemoveFavorite = (stationId: string) => {
    toggleFavorite(stationId);
    setFavorites(getFavorites());
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    if (window.confirm('确定要删除这条反馈吗？')) {
      deleteFeedback(feedbackId);
      setFeedbacks(getFeedbacks());
    }
  };

  const maxCost = Math.max(...monthlyStats.map(m => m.cost), 1);
  const maxCount = Math.max(...monthlyStats.map(m => m.count), 1);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">🚗</div>
        <div className="profile-name">电动车主</div>
        <div className="profile-join">绿色出行，从充电开始</div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="quick-stat-value">{totalSessions}</div>
          <div className="quick-stat-label">充电次数</div>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-value orange">¥{totalCost.toFixed(0)}</div>
          <div className="quick-stat-label">累计花费</div>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-value green">{totalEnergy.toFixed(1)}°</div>
          <div className="quick-stat-label">累计电量</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px' }}>
        <div className="tab-bar">
          {[
            { key: 'stats' as ProfileTab, label: '月度统计' },
            { key: 'history' as ProfileTab, label: '充电记录' },
            { key: 'favorites' as ProfileTab, label: '我的收藏' },
            { key: 'feedbacks' as ProfileTab, label: '我的反馈' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Tab */}
      {tab === 'stats' && (
        <>
          <div className="chart-section">
            <div className="section-title">📊 月度充电花费趋势</div>
            <div className="chart-container">
              {monthlyStats.map((m, i) => (
                <div key={i} className="chart-bar-group">
                  <div
                    className="chart-bar cost"
                    style={{ height: `${Math.max((m.cost / maxCost) * 150, 4)}px` }}
                  >
                    {m.cost > 0 && (
                      <span className="chart-bar-value">¥{m.cost.toFixed(0)}</span>
                    )}
                  </div>
                  <div className="chart-label">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot cost" />
                <span>花费金额</span>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <div className="section-title">📈 月度充电频次</div>
            <div className="freq-chart">
              {monthlyStats.map((m, i) => (
                <div key={i} className="freq-bar-wrapper">
                  <div className="freq-value">{m.count}</div>
                  <div
                    className="freq-bar"
                    style={{ height: `${Math.max((m.count / maxCount) * 80, 4)}px` }}
                  />
                  <div className="freq-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <div className="section-title">⚡ 月度充电量</div>
            <div className="chart-container">
              {monthlyStats.map((m, i) => {
                const maxEnergy = Math.max(...monthlyStats.map(s => s.energy), 1);
                return (
                  <div key={i} className="chart-bar-group">
                    <div
                      className="chart-bar count"
                      style={{ height: `${Math.max((m.energy / maxEnergy) * 150, 4)}px` }}
                    >
                      {m.energy > 0 && (
                        <span className="chart-bar-value">{m.energy.toFixed(1)}</span>
                      )}
                    </div>
                    <div className="chart-label">{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot count" />
                <span>充电量 (kWh)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="history-section">
          <div className="section-title">🕐 充电历史记录</div>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无充电记录</div>
            </div>
          ) : (
            history.map(session => (
              <div key={session.id} className="history-item">
                <div className={`history-icon ${session.status === 'completed' ? 'completed' : 'stopped'}`}>
                  {session.status === 'completed' ? '✅' : '⏹️'}
                </div>
                <div className="history-info">
                  <div className="history-station">{session.stationName}</div>
                  <div className="history-time">{formatDate(session.startTime)}</div>
                </div>
                <div className="history-right">
                  <div className="history-amount">¥{session.cost.toFixed(2)}</div>
                  <div className="history-duration">{formatDuration(session.duration)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {tab === 'favorites' && (
        <div className="favorites-section">
          <div className="section-title">⭐ 收藏的充电站</div>
          {favoriteStations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-text">暂无收藏的充电站</div>
            </div>
          ) : (
            favoriteStations.map(station => (
              <div key={station.id} className="favorite-item">
                <div className="favorite-icon">⚡</div>
                <div className="favorite-info">
                  <div className="favorite-name">{station.name}</div>
                  <div className="favorite-address">{station.address}</div>
                </div>
                <button
                  className="favorite-remove"
                  onClick={() => handleRemoveFavorite(station.id)}
                >
                  取消收藏
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Feedbacks Tab */}
      {tab === 'feedbacks' && (
        <div className="feedbacks-section">
          <div className="section-title">📝 我的反馈</div>
          {feedbacks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">暂无反馈记录</div>
              <div className="empty-state-sub">充电结束后可以为充电站写下使用反馈哦</div>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div key={fb.id} className="my-feedback-item">
                <div className="my-feedback-header">
                  <div className="my-feedback-station">
                    <span className="feedback-station-icon">⚡</span>
                    {fb.stationName}
                  </div>
                  <button
                    className="feedback-delete-btn"
                    onClick={() => handleDeleteFeedback(fb.id)}
                  >
                    删除
                  </button>
                </div>
                <div className="my-feedback-meta">
                  <div className="my-feedback-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={s <= fb.rating ? 'star-filled' : 'star-empty'}>
                        {s <= fb.rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <div className="my-feedback-date">{formatDate(fb.createdAt)}</div>
                </div>
                {fb.issues.length > 0 && (
                  <div className="my-feedback-issues">
                    {fb.issues.map(issue => (
                      <span key={issue} className="my-feedback-issue-tag">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
                {fb.content && (
                  <div className="my-feedback-content">{fb.content}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
