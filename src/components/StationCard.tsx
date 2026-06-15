import { ChargingStation, Feedback, FEEDBACK_ISSUES } from '../types';
import { getFeedbacksByStation, getStationAverageRating, updateFeedback, deleteFeedback } from '../utils/storage';
import { useState, useEffect } from 'react';

interface Props {
  station: ChargingStation;
  isFav: boolean;
  onToggleFavorite: () => void;
  onStartCharge: () => void;
  onClose: () => void;
  hasActiveSession: boolean;
}

export default function StationCard({ station, isFav, onToggleFavorite, onStartCharge, onClose, hasActiveSession }: Props) {
  const canCharge = station.freeGuns > 0 && !hasActiveSession;
  const chargeTypeLabel = station.chargerType === 'fast' ? '快充' : station.chargerType === 'slow' ? '慢充' : '快充/慢充';
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  const [showEditFeedback, setShowEditFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editIssues, setEditIssues] = useState<string[]>([]);
  const [editContent, setEditContent] = useState('');

  const refreshFeedbacks = () => {
    setFeedbacks(getFeedbacksByStation(station.id));
    setAvgRating(getStationAverageRating(station.id));
  };

  useEffect(() => {
    refreshFeedbacks();
  }, [station.id]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  };

  const renderStars = (rating: number, size: 'small' | 'normal' = 'normal') => {
    return (
      <div className={size === 'small' ? 'stars-small' : 'stars-normal'}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={s <= rating ? 'star-filled' : 'star-empty'}>
            {s <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const handleEditFeedback = (fb: Feedback) => {
    setEditingFeedback(fb);
    setEditRating(fb.rating);
    setEditIssues([...fb.issues]);
    setEditContent(fb.content);
    setShowEditFeedback(true);
  };

  const handleDeleteFeedback = (fbId: string) => {
    if (window.confirm('确定要删除这条反馈吗？')) {
      deleteFeedback(fbId);
      refreshFeedbacks();
    }
  };

  const handleToggleEditIssue = (issue: string) => {
    setEditIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleSaveEditFeedback = () => {
    if (!editingFeedback) return;
    updateFeedback(editingFeedback.id, {
      rating: editRating,
      issues: editIssues,
      content: editContent.trim(),
    });
    setShowEditFeedback(false);
    setEditingFeedback(null);
    refreshFeedbacks();
  };

  return (
    <div className="station-card">
      <div className="station-card-header">
        <div>
          <div className="station-name">
            {station.name}
          </div>
          <div className="station-address">{station.address}</div>
          {feedbacks.length > 0 && (
            <div className="station-rating-summary">
              {renderStars(Math.round(avgRating), 'small')}
              <span className="rating-score">{avgRating.toFixed(1)}</span>
              <span className="rating-count">({feedbacks.length}条评价)</span>
            </div>
          )}
        </div>
        <button className="favorite-btn" onClick={onToggleFavorite}>
          {isFav ? '⭐' : '☆'}
        </button>
      </div>

      <div className="station-info-grid">
        <div className="info-item">
          <div className="info-label">充电类型</div>
          <div className="info-value">{chargeTypeLabel}</div>
        </div>
        <div className="info-item">
          <div className="info-label">每度电价格</div>
          <div className="info-value price">¥{station.pricePerKwh.toFixed(2)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">空闲枪数</div>
          <div className="info-value">{station.freeGuns} / {station.totalGuns}</div>
        </div>
        <div className="info-item">
          <div className="info-label">距离</div>
          <div className="info-value">{station.distance}km</div>
        </div>
      </div>

      <div className="station-guns">
        <div className="guns-title">充电枪状态</div>
        <div className="gun-list">
          {station.guns.map(gun => (
            <span
              key={gun.id}
              className={`gun-tag ${gun.status === 'free' ? 'free' : gun.status === 'in-use' ? 'in-use' : 'fault'}`}
            >
              {gun.type === 'fast' ? '快' : '慢'} · {gun.power}kW · {gun.status === 'free' ? '空闲' : gun.status === 'in-use' ? '使用中' : '故障'}
            </span>
          ))}
        </div>
      </div>

      {/* Feedbacks section */}
      <div className="station-feedbacks">
        <div className="feedbacks-title">
          <span>📝 用户反馈</span>
          <span className="feedbacks-count">{feedbacks.length}条</span>
        </div>
        {feedbacks.length === 0 ? (
          <div className="feedbacks-empty">
            暂无用户反馈，成为第一个评价的人吧
          </div>
        ) : (
          <div className="feedbacks-list">
            {feedbacks.slice(0, 5).map(fb => (
              <div key={fb.id} className="feedback-item">
                <div className="feedback-item-header">
                  {renderStars(fb.rating, 'small')}
                  <span className="feedback-item-date">{formatDate(fb.createdAt)}</span>
                </div>
                {fb.issues.length > 0 && (
                  <div className="feedback-item-issues">
                    {fb.issues.map(issue => (
                      <span key={issue} className="feedback-issue-tag">{issue}</span>
                    ))}
                  </div>
                )}
                {fb.content && (
                  <div className="feedback-item-content">{fb.content}</div>
                )}
                <div className="feedback-item-actions">
                  <button
                    className="feedback-action-btn edit"
                    onClick={() => handleEditFeedback(fb)}
                  >
                    编辑
                  </button>
                  <button
                    className="feedback-action-btn delete"
                    onClick={() => handleDeleteFeedback(fb.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            {feedbacks.length > 5 && (
              <div className="feedbacks-more">查看全部 {feedbacks.length} 条反馈 →</div>
            )}
          </div>
        )}
      </div>

      <button
        className="start-charge-btn"
        onClick={onStartCharge}
        disabled={!canCharge}
      >
        {!canCharge && hasActiveSession
          ? '已有充电进行中'
          : station.freeGuns === 0
          ? '暂无空闲充电枪'
          : '开始充电'}
      </button>
      <button className="close-card-btn" onClick={onClose}>
        关闭
      </button>

      {/* Edit Feedback Modal */}
      {showEditFeedback && editingFeedback && (
        <div className="modal-overlay" onClick={() => setShowEditFeedback(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="feedback-title">编辑反馈</div>
            <div className="feedback-subtitle">修改您对本次充电的评价</div>
            <div className="feedback-station-name">{editingFeedback.stationName}</div>

            <div className="feedback-section">
              <div className="feedback-label">综合评分</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className="star-btn"
                    onClick={() => setEditRating(star)}
                  >
                    {star <= editRating ? '★' : '☆'}
                  </button>
                ))}
                <span className="rating-text">
                  {editRating === 5 ? '非常满意' : editRating === 4 ? '满意' : editRating === 3 ? '一般' : editRating === 2 ? '不满意' : '非常不满'}
                </span>
              </div>
            </div>

            <div className="feedback-section">
              <div className="feedback-label">遇到的问题（可多选）</div>
              <div className="issues-tags">
                {FEEDBACK_ISSUES.map(issue => (
                  <button
                    key={issue}
                    className={`issue-tag ${editIssues.includes(issue) ? 'selected' : ''}`}
                    onClick={() => handleToggleEditIssue(issue)}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-section">
              <div className="feedback-label">详细描述（选填）</div>
              <textarea
                className="feedback-textarea"
                placeholder="请描述您遇到的问题或建议..."
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="textarea-counter">{editContent.length}/500</div>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button
                className="feedback-cancel-btn"
                onClick={() => setShowEditFeedback(false)}
              >
                取消
              </button>
              <button
                className="feedback-submit-btn"
                onClick={handleSaveEditFeedback}
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
