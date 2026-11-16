import { joinClassNames } from '@/components/ui/join-class-names';
import type { ResumeReviewCopy } from '@/lib/content';
import { formatManilaTime } from '@/lib/resume-request/manila-time';
import type {
  ResumeRequestDecision,
  ResumeRequestView,
} from '@/lib/resume-request/resume-request-repository';
import { decideResumeRequest } from './decide-resume-request';
import styles from './resume-request-review.module.scss';

interface ResumeRequestReviewProps {
  view: ResumeRequestView;
  approvalToken: string;
  copy: ResumeReviewCopy;
}

interface DecisionFormProps {
  view: ResumeRequestView;
  approvalToken: string;
  decision: ResumeRequestDecision;
  label: string;
  buttonClassName: string;
}

function DecisionForm({
  view,
  approvalToken,
  decision,
  label,
  buttonClassName,
}: DecisionFormProps) {
  return (
    <form action={decideResumeRequest}>
      <input type="hidden" name="requestId" value={view.record.id} />
      <input type="hidden" name="token" value={approvalToken} />
      <input type="hidden" name="decision" value={decision} />
      <button type="submit" className={joinClassNames('btn', buttonClassName)}>
        {label}
      </button>
    </form>
  );
}

export function ResumeRequestReview({ view, approvalToken, copy }: ResumeRequestReviewProps) {
  const { record, status } = view;
  const details = [
    { label: copy.labels.name, value: record.name },
    { label: copy.labels.email, value: record.email },
    { label: copy.labels.note, value: record.note ?? copy.emptyValue },
    { label: copy.labels.country, value: record.country ?? copy.emptyValue },
    { label: copy.labels.requestedAt, value: formatManilaTime(record.createdAtMs) },
    { label: copy.labels.decideBy, value: formatManilaTime(record.decideByMs) },
    { label: copy.labels.status, value: copy.statusLabels[status] },
  ];

  return (
    <div className="container py-5">
      <div className={joinClassNames('card', styles.panel)}>
        <div className="card-body">
          <h1 className={styles.heading}>{copy.title}</h1>
          <dl className={styles.details}>
            {details.map((detail) => (
              <div className={styles.detail} key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
          {status === 'pending' && (
            <div className="d-flex flex-wrap gap-3">
              <DecisionForm
                view={view}
                approvalToken={approvalToken}
                decision="approved"
                label={copy.approveLabel}
                buttonClassName="btn-primary btn-glow"
              />
              <DecisionForm
                view={view}
                approvalToken={approvalToken}
                decision="denied"
                label={copy.denyLabel}
                buttonClassName="btn-outline-body"
              />
            </div>
          )}
          {status === 'expired' && (
            <p className={styles.expired}>
              {copy.expiredMessage} <strong className={styles.email}>{record.email}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
