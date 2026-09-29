using dotnet.Models;

namespace dotnet.Services
{
    public interface ITunnelRecordService
    {
        Task<IEnumerable<TunnelRecordDto>> GetAllAsync(string vehicleId);
        Task<long> AddAsync(string vehicleId, TunnelRecordDto req);
        Task<bool> DeleteByIdAsync(string vehicleId, long id);
        Task<UpdateOutcome> UpdateAsync(string vehicleId, long id, TunnelRecordDto req);
    }

    public class TunnelRecordService : ITunnelRecordService
    {
        private readonly AppDbContext _context;
        public TunnelRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<TunnelRecord> TunnelRecords => _context.TunnelRecords;
        public async Task<IEnumerable<TunnelRecordDto>> GetAllAsync(string vehicleId)
        {
            return await Task.Run(() => TunnelRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                .Select(f => f.Data).ToList());
        }
        public async Task<long> AddAsync(string vehicleId, TunnelRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;

            var record = new TunnelRecord(req) { VehicleId = vehicleId };
            await _context.TunnelRecords.AddAsync(record);
            await _context.SaveChangesAsync();
            return record.Id;
        }
        public async Task<bool> DeleteByIdAsync(string vehicleId, long id)
        {
            var record = await Task.Run(() => TunnelRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return false;

            _context.TunnelRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(string vehicleId, long id, TunnelRecordDto req)
        {
            var record = await Task.Run(() => TunnelRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            record.Date = req.Date;
            record.Tunnel = req.Tunnel;
            record.Bound = req.Bound;
            record.Fee = req.Fee;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
    }
}
