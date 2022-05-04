use std::{collections::HashMap};
use std::collections::hash_map::Entry;
pub struct  SymbolTable {
    table: HashMap<String, u16>,
    current: u16,
}
impl SymbolTable {
    fn new() -> SymbolTable {
        let mut table = HashMap::new();
        table.insert("SP".to_string(),     0x0);
        table.insert("LCL".to_string(),    0x1);
        table.insert("ARG".to_string(),    0x2);
        table.insert("THIS".to_string(),   0x3);
        table.insert("THAT".to_string(),   0x4);
        table.insert("R0".to_string(),     0x0);
        table.insert("R1".to_string(),     0x1);
        table.insert("R2".to_string(),     0x2);
        table.insert("R3".to_string(),     0x3);
        table.insert("R4".to_string(),     0x4);
        table.insert("R5".to_string(),     0x5);
        table.insert("R6".to_string(),     0x6);
        table.insert("R7".to_string(),     0x7);
        table.insert("R8".to_string(),     0x8);
        table.insert("R9".to_string(),     0x9);
        table.insert("R10".to_string(),    0xa);
        table.insert("R11".to_string(),    0xb);
        table.insert("R12".to_string(),    0xc);
        table.insert("R13".to_string(),    0xd);
        table.insert("R14".to_string(),    0xe);
        table.insert("R15".to_string(),    0xf);
        table.insert("SCREEN".to_string(), 0x4000);
        table.insert("KBD".to_string(),    0x6000);
        SymbolTable { table, current: 0x10 }
    }
    pub fn get_instance() -> &'static mut SymbolTable {
        static mut INSTANCE: Option<SymbolTable> = None;
        unsafe {
            if INSTANCE.is_none() {
                INSTANCE = Some(SymbolTable::new());
            }
            INSTANCE.as_mut().unwrap()
        }
    }

    pub fn add_entry(&mut self, symbol: &str, address: u16) {
        self.table.insert(symbol.to_string(), address);
    }
    
    // pub fn contains(&self, symbol: &str) -> bool {
    //     self.table.contains_key(symbol)
    // }
    pub fn get_else_set(&mut self, label: &str) -> u16 {
        let addr = match self.table.entry(label.to_string()) {
            Entry::Occupied(entry) => entry.get().clone(),
            Entry::Vacant(entry) => {
                let current = self.current;
                entry.insert(current);
                self.current += 1;
                current
            },
        };
        addr
    }
}
