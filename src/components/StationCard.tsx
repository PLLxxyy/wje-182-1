import { ChargingStation, Feedback } from '../types';
import { getFeedbacksByStation, getStationAverageRating } from '../utils/storage';
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

  useEffect(() => {
    setFeedbacks(getFeedbacksByStation(station.id));
    setAvgRating(getStationAverageRating(station.id));
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
    </div>
  );
}
