using dotnet.Models;

namespace dotnet.Services
{
    public interface IFineRecordService
    {
        Task<IEnumerable<FineRecordDto>> GetAllAsync(int vehicleId);
        Task<long> AddAsync(int vehicleId, FineRecordDto req);
        Task<bool> DeleteByIdAsync(int vehicleId, long id);
        Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, FineRecordDto req);
    }

    public class FineRecordService : IFineRecordService
    {
        private readonly AppDbContext _context;
        public FineRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<FineRecord> FineRecords => _context.FineRecords;
        public async Task<IEnumerable<FineRecordDto>> GetAllAsync(int vehicleId)
        {
            return await Task.Run(() => FineRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                .Select(f => f.Data).ToList());
        }
        public async Task<long> AddAsync(int vehicleId, FineRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;

            var record = new FineRecord(req) { VehicleId = vehicleId };
            await _context.FineRecords.AddAsync(record);
            await _context.SaveChangesAsync();
            return record.Id;
        }
        public async Task<bool> DeleteByIdAsync(int vehicleId, long id)
        {
            var record = await Task.Run(() => FineRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return false;

            ImageStorage.DeleteFor(_context, "fine_record", (int)record.Id);
            _context.FineRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(int vehicleId, long id, FineRecordDto req)
        {
            var record = await Task.Run(() => FineRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            record.Date = req.Date;
            record.Offences = System.Text.Json.JsonSerializer.Serialize(req.Offences ?? []);
            record.CustomOffence = req.CustomOffence;
            record.Location = req.Location;
            record.Penalty = req.Penalty;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
    }
}
