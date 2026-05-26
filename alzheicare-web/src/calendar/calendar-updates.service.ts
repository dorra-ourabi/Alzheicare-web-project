import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type CalendarUpdateEvent = {
  type: 'calendar:update';
  source: 'local' | 'google';
  timestamp: number;
};

@Injectable()
export class CalendarUpdatesService {
  private readonly subjects = new Map<number, Subject<CalendarUpdateEvent>>();

  subscribe(userId: number): Observable<CalendarUpdateEvent> {
    return this.getSubject(userId).asObservable();
  }

  emit(userId: number, source: CalendarUpdateEvent['source']) {
    this.getSubject(userId).next({
      type: 'calendar:update',
      source,
      timestamp: Date.now(),
    });
  }

  private getSubject(userId: number) {
    const existing = this.subjects.get(userId);
    if (existing) {
      return existing;
    }

    const created = new Subject<CalendarUpdateEvent>();
    this.subjects.set(userId, created);
    return created;
  }
}
