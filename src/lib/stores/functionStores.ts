
function getElapsedTime(time: string, getForTicket?: boolean, getForCheckStatus?: boolean, isConversationInfo? : boolean) {
    const startTime = new Date(time);
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const seconds = Math.trunc(elapsedTime / 1000);
    const minutes = Math.trunc(seconds / 60);
    const hours = Math.trunc(minutes / 60);
    const days = Math.trunc(hours / 24);
    const months = Math.trunc(days / 30);
    const years = Math.trunc(months / 12);
    if (isConversationInfo) {
        if (time !== 'offline' && time !== 'disable' && time !== 'online') {
            const status = 'Hoạt động '
            if (hours < 1) return `${status} ${minutes} phút trước`;
            else if (days < 1) return `${status} ${hours} giờ trước`;
            else if (months < 1) return `${status} ${days} ngày trước`;
            else if (years < 1) return `${status} ${months} tháng trước`;
            else if (years > 0) return `${status} ${years} năm trước`;
        } else if (time === 'online') return 'Đang hoạt động';
    }
    if (getForCheckStatus) {
        if (hours > 0) return 'disable';
    } else {
        if (hours < 1) return `${getForTicket ? `${minutes} phút`: `${minutes}m`}`;
        else if (days < 1) return `${getForTicket ? `${hours} giờ`: `${hours}h`}`;
        else if (months < 1) return `${getForTicket ? `${days} ngày`: `${days}d`}`;
        else if (years < 1) return `${getForTicket ? `${months} tháng`: `${months}m`}`;
        else if (years > 0) return `${getForTicket ? `${years} năm`: `${years}y`}`;
    }
}

export { getElapsedTime }
