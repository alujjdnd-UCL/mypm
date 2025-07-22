// This is a test component to verify sessions functionality works
'use client';

import { useEffect, useState } from 'react';

export default function TestSession() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/sessions')
            .then(res => res.json())
            .then(data => {
                setSessions(data.sessions || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching sessions:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading sessions...</div>;
    }

    return (
        <div>
            <h1>Sessions Test</h1>
            <p>Found {sessions.length} sessions</p>
            {sessions.map((session: unknown) => {
                const s = session as { id: string; title: string; description: string };
                return (
                    <div key={s.id}>
                        <h3>{s.title}</h3>
                        <p>{s.description}</p>
                    </div>
                );
            })}
        </div>
    );
}
