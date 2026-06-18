import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { listOrganizations } from '../../lib/organizationService';
import type { Organization } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminOrganizationList() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setOrganizations(await listOrganizations());
    } catch (error) {
      console.error('Failed to load organizations', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/qmeFirstLogo.jpg" titleLine1="ADMIN" titleLine2="ORGS" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>
          Organizations
        </h1>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading...</p>}

      {!loading && organizations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1rem', color: '#777', marginBottom: '1rem' }}>
            No organizations yet. Run the organization foundation SQL first.
          </p>
        </div>
      )}

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '0.8rem',
              background: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <Link
                to={`/admin/organizations/${org.id}`}
                style={{ fontWeight: 800, color: '#2f3e4f', textDecoration: 'none', fontSize: '1.1rem' }}
              >
                {org.name}
              </Link>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                /{org.slug} · {org.status}
              </div>
              {org.description && (
                <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 6 }}>
                  {org.description}
                </div>
              )}
            </div>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate(`/admin/organizations/${org.id}`)}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
