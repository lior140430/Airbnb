import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useAsync } from '@/hooks/useAsync';
import { ArrowRight } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProperty } from '../../property.service';
import { PropertyDetail } from '../PropertyDetail/PropertyDetail';
import './PropertyPage.css';

export const PropertyPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const fetchProperty = useCallback(() => {
        if (!id) return Promise.reject('No ID');
        return getProperty(id);
    }, [id]);

    const { data: property, loading, error, execute, setData } = useAsync(fetchProperty);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [id]);

    useEffect(() => {
        if (id) execute();
    }, [id, execute]);

    if (loading) {
        return (
            <div className="property-page-loading">
                <Spinner size={40} />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="property-page-error">
                <h2>הנכס לא נמצא</h2>
                <button className="property-page-back" onClick={() => navigate('/')}>
                    <ArrowRight size={18} />
                    חזרה לדף הבית
                </button>
            </div>
        );
    }

    return (
        <div className="property-page">
            <PropertyDetail property={property} onRefresh={() => {
                if (id) getProperty(id).then(setData);
            }} />
        </div>
    );
};
