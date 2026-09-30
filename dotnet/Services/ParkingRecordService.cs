using dotnet.Models;

namespace dotnet.Services
{
    public interface IParkingRecordService
    {
        Task<IEnumerable<ParkingRecordDto>> GetAllAsync(string vehicleId);
        Task<long> AddAsync(string vehicleId, ParkingRecordDto req);
        Task<bool> DeleteByIdAsync(string vehicleId, long id);
        Task<UpdateOutcome> UpdateAsync(string vehicleId, long id, ParkingRecordDto req);
    }

    public class ParkingRecordService : IParkingRecordService
    {
        private readonly AppDbContext _context;
        public ParkingRecordService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public IEnumerable<ParkingRecord> ParkingRecords => _context.ParkingRecords;
        public async Task<IEnumerable<ParkingRecordDto>> GetAllAsync(string vehicleId)
        {
            return await Task.Run(() => ParkingRecords
                .Where(f => f.VehicleId == vehicleId)
                .OrderByDescending(f => f.Date).ThenByDescending(f => f.Id)
                .Select(f => f.Data).ToList());
        }
        public async Task<long> AddAsync(string vehicleId, ParkingRecordDto req)
        {
            var vehicle = await Task.Run(() => Vehicles.Where(v => v.Id == vehicleId).FirstOrDefault());
            if (vehicle is null) return 0;

            var record = new ParkingRecord(req) { VehicleId = vehicleId };
            await _context.ParkingRecords.AddAsync(record);
            await _context.SaveChangesAsync();
            return record.Id;
        }
        public async Task<bool> DeleteByIdAsync(string vehicleId, long id)
        {
            var record = await Task.Run(() => ParkingRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return false;

            _context.ParkingRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<UpdateOutcome> UpdateAsync(string vehicleId, long id, ParkingRecordDto req)
        {
            var record = await Task.Run(() => ParkingRecords
                .Where(f => f.Id == id && f.VehicleId == vehicleId).FirstOrDefault());
            if (record is null) return UpdateOutcome.NotFound;

            record.Date = req.Date;
            record.Carpark = req.Carpark;
            record.RentalType = req.RentalType;
            record.Fee = req.Fee;
            await _context.SaveChangesAsync();
            return UpdateOutcome.Updated;
        }
    }
}
