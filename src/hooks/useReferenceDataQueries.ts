import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

export function useUsersQuery(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.users,
        queryFn: ApiService.getUsers,
        enabled,
    });
}

export function useUnitsQuery(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.units,
        queryFn: ApiService.getUnits,
        enabled,
    });
}

export function useEtollsQuery(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.etolls,
        queryFn: ApiService.getEtolls,
        enabled,
    });
}

export function useActiveEtollsQuery(enabled: boolean = true) {
    return useQuery({
        queryKey: queryKeys.activeEtolls,
        queryFn: ApiService.getActiveEtolls,
        enabled,
    });
}

