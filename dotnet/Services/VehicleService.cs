using System.Data.Entity;
using dotnet.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Services
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleDto>> GetAllAsync();
        Task<VehicleDto?> GetByIdAsync(int id);
        Task<int> AddAsync(VehicleDto req);
        Task<bool> UpdateAsync(int id, VehicleDto req);
        Task<bool> DeleteByIdAsync(int id);
    }

    public class VehicleService : IVehicleService
    {
        private readonly AppDbContext _context;
        public VehicleService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public static string NormalizePlate(string? plate) => (plate ?? string.Empty).Trim().ToUpper();
        public static bool IsValidYear(int? year)
        {
            if (year is null) return true;
            return year >= 1900 && year <= DateTime.Now.Year + 1;
        }
        public async Task<IEnumerable<VehicleDto>> GetAllAsync()
        {
            return await Task.Run(() => Vehicles.OrderBy(v => v.Id).Select(v => v.Data).ToList());
        }
        public async Task<VehicleDto?> GetByIdAsync(int id)
        {
            return await Task.Run(() => GetById(id)?.Data ?? null);
        }
        public async Task<int> AddAsync(VehicleDto req)
        {
            var entity = await _context.Vehicles.AddAsync(new(req));
            await _context.SaveChangesAsync();
            return entity.Entity.Id;
        }
        public async Task<bool> UpdateAsync(int id, VehicleDto req)
        {
            var vehicle = await Task.Run(() => GetById(id));
            if (vehicle is null) return false;

            vehicle.Plate = NormalizePlate(req.Plate);
            vehicle.Type = req.Type;
            vehicle.Brand = (req.Brand ?? string.Empty).Trim();
            vehicle.Model = (req.Model ?? string.Empty).Trim();
            vehicle.Year = req.Year;
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> DeleteByIdAsync(int id)
        {
            var vehicle = await Task.Run(() => GetById(id));
            if (vehicle is null) return false;

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }
        private Vehicle? GetById(int id)
        {
            return Vehicles.Where(v => v.Id == id).FirstOrDefault();
        }
    }
}
