using System.Data.Entity;
using dotnet.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Services
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleDto>> GetAllAsync();
        Task<VehicleDto?> GetByIdAsync(string id);
        Task<bool> AddAsync(VehicleDto req);
        Task<bool> DeleteByIdAsync(string id);
    }

    public class VehicleService : IVehicleService
    {
        private readonly AppDbContext _context;
        public VehicleService(AppDbContext context)
        {
            _context = context;
        }
        public IEnumerable<Vehicle> Vehicles => _context.Vehicles;
        public async Task<IEnumerable<VehicleDto>> GetAllAsync()
        {
            return await Task.Run(() => Vehicles.Select(v => v.Data).ToList());
        }
        public async Task<VehicleDto?> GetByIdAsync(string id)
        {
            return await Task.Run(() => GetById(id)?.Data ?? null);
        }
        public async Task<bool> AddAsync(VehicleDto req)
        {
            var vehicle = await GetByIdAsync(req.Id);
            if (vehicle is not null) return false;

            await _context.Vehicles.AddAsync(new(req));
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> DeleteByIdAsync(string id)
        {
            var vehicle = await Task.Run(() => GetById(id));
            if (vehicle is null) return false;

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }
        private Vehicle? GetById(string id)
        {
            id.ToUpper();
            return Vehicles.Where(v => v.Id == id).FirstOrDefault();
        }
    }
}
